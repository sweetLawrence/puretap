import supabase from '../config/supabase.js'
import QRCode from 'qrcode'

export const getAll = async () => {
  const { data, error } = await supabase
    .from('meters')
    .select(`
      *,
      customers (id, full_name, phone, account_no)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('meters')
    .select(`
      *,
      customers (id, full_name, phone, account_no)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Meter not found')
  return data
}

export const getByCustomerId = async (customer_id) => {
  const { data, error } = await supabase
    .from('meters')
    .select('*')
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const create = async ({ serial_no, customer_id, installation_address }) => {
  const { data: existing } = await supabase
    .from('meters')
    .select('id')
    .eq('serial_no', serial_no)
    .single()

  if (existing) throw new Error('Meter serial number already exists')

  // generate QR code as base64 data URL
  const qrData = `${process.env.APP_URL}/read/${serial_no}`
  const qr_code_url = await QRCode.toDataURL(qrData)

  const { data, error } = await supabase
    .from('meters')
    .insert({
      serial_no,
      customer_id,
      installation_address,
      qr_code_url,
      is_active: true,
      installed_at: new Date(),
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
    .from('meters')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const deactivate = async (id) => {
  const { data, error } = await supabase
    .from('meters')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const getBySerialNo = async (serial_no) => {
  const { data, error } = await supabase
    .from('meters')
    .select(`
      *,
      customers (id, full_name, phone, account_no, customer_type)
    `)
    .eq('serial_no', serial_no)
    .single()

  if (error) throw new Error('Meter not found')
  return data
}