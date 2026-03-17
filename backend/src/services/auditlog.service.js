import supabase from '../config/supabase.js'

export const log = async ({ user_id, action, table_name, record_id, old_data, new_data, ip_address }) => {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user_id || null,
      action,
      table_name,
      record_id: record_id || null,
      old_data: old_data || null,
      new_data: new_data || null,
      ip_address: ip_address || null,
      created_at: new Date()
    })

  if (error) console.error('Audit log failed:', error.message)
}

export const getAll = async ({ from, to, user_id, table_name, action } = {}) => {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      users (id, full_name, role)
    `)
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  if (user_id) query = query.eq('user_id', user_id)
  if (table_name) query = query.eq('table_name', table_name)
  if (action) query = query.ilike('action', `%${action}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      users (id, full_name, role)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Audit log not found')
  return data
}