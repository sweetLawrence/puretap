import supabase from '../config/supabase.js'

export const create = async ({ customer_id, type, subject, message, rating }) => {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      customer_id,
      type,
      subject,
      message,
      rating: type === 'review' ? rating : null,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export const getAll = async ({ type, status } = {}) => {
  let query = supabase
    .from('feedback')
    .select(`*, customers (id, full_name, account_no, phone)`)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export const getByCustomer = async (customer_id) => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export const respond = async (id, { status, admin_response, responded_by }) => {
  const { data, error } = await supabase
    .from('feedback')
    .update({
      status,
      admin_response,
      responded_by,
      responded_at: new Date(),
      updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export const updateStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('feedback')
    .update({ status, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}