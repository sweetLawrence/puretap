import supabase from '../config/supabase.js'
import { ACCOUNT_NO_CONFIG } from '../utils/constants.js'

export const generateAccountNo = async () => {
  const { prefix, digits, separator } = ACCOUNT_NO_CONFIG

  // find the last account number with this prefix
  const { data, error } = await supabase
    .from('customers')
    .select('account_no')
    .ilike('account_no', `${prefix}${separator}%`)
    .order('account_no', { ascending: false })
    .limit(1)
    .single()

  let nextNumber = 1

  if (data?.account_no) {
    // extract the numeric part after the separator
    const parts = data.account_no.split(separator)
    const lastNumber = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1
  }

  const padded = String(nextNumber).padStart(digits, '0')
  return `${prefix}${separator}${padded}`
}

export const getAll = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error('Customer not found')
  return data
}

// export const create = async ({ full_name, phone, email, address, account_no, customer_type }) => {
//   const { data: existing } = await supabase
//     .from('customers')
//     .select('id')
//     .eq('phone', phone)
//     .single()

//   if (existing) throw new Error('Phone number already registered')

//   const { data, error } = await supabase
//     .from('customers')
//     .insert({
//       full_name,
//       phone,
//       email,
//       address,
//       account_no,
//       customer_type,
//       is_active: true,
//       created_at: new Date(),
//       updated_at: new Date()
//     })
//     .select()
//     .single()

//   if (error) throw new Error(error.message)
//   return data
// }


export const create = async ({ full_name, phone, email, address, customer_type }) => {
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .single()

  if (existing) throw new Error('Phone number already registered')

  // auto-generate account number
  const account_no = await generateAccountNo()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name, phone, email, address,
      account_no,
      customer_type,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const update = async (id, updates) => {
  const { data, error } = await supabase
    .from('customers')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const deactivate = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// export const search = async (query) => {
//   const { data, error } = await supabase
//     .from('customers')
//     .select('*')
//     .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,account_no.ilike.%${query}%`)
//     .order('full_name', { ascending: true })

//   if (error) throw new Error(error.message)
//   return data
// }



export const search = async (query) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .order('full_name', { ascending: true })

  if (error) throw new Error(error.message)

  // also search by phone and account_no separately and merge
  const { data: byPhone } = await supabase
    .from('customers')
    .select('*')
    .ilike('phone', `%${query}%`)

  const { data: byAccount } = await supabase
    .from('customers')
    .select('*')
    .ilike('account_no', `%${query}%`)

  // merge and deduplicate by id
  const all = [...(data || []), ...(byPhone || []), ...(byAccount || [])]
  const unique = Array.from(new Map(all.map(c => [c.id, c])).values())

  return unique
}