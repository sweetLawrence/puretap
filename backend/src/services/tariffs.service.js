import supabase from '../config/supabase.js'

export const getAll = async () => {
  const { data, error } = await supabase
    .from('tariffs')
    .select('*')
    .order('customer_type', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export const getActive = async () => {
  const { data, error } = await supabase
    .from('tariffs')
    .select('*')
    .eq('is_active', true)
    .order('customer_type', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('tariffs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error('Tariff not found')
  return data
}

export const create = async ({ name, customer_type, min_units, max_units, rate_per_unit, fixed_charge, effective_from }) => {
  const { data, error } = await supabase
    .from('tariffs')
    .insert({
      name,
      customer_type,
      min_units,
      max_units,
      rate_per_unit,
      fixed_charge,
      effective_from,
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
    .from('tariffs')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const deactivate = async (id) => {
  const { data, error } = await supabase
    .from('tariffs')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// NEW: Activate tariff
export const activate = async (id) => {
  const { data, error } = await supabase
    .from('tariffs')
    .update({ is_active: true, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}




// NEW: Delete tariff permanently
export const deleteTariff = async (id) => {
  // Optional: Check if tariff is being used in any invoices before deleting
  const { count, error: checkError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tariff_id', id)  // Only if you have tariff_id in invoices table
  
  // If you want to prevent deletion if tariff is in use:
  // if (count > 0) {
  //   throw new Error('Cannot delete tariff that has been used in invoices')
  // }
  
  const { data, error } = await supabase
    .from('tariffs')
    .delete()
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}