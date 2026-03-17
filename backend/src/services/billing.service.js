import supabase from '../config/supabase.js'

const calculateAmount = (units_consumed, customer_type, tariffs) => {
  const slabs = tariffs
    .filter(t => t.customer_type === customer_type && t.is_active)
    .sort((a, b) => a.min_units - b.min_units)

  if (slabs.length === 0) throw new Error(`No active tariffs found for ${customer_type}`)

  const fixed_charge = slabs[0].fixed_charge
  let amount_due = parseFloat(fixed_charge)
  let remaining = units_consumed

  for (const slab of slabs) {
    if (remaining <= 0) break

    const slab_max = slab.max_units === null ? Infinity : parseFloat(slab.max_units)
    const slab_min = parseFloat(slab.min_units)
    const slab_size = slab_max - slab_min
    const units_in_slab = Math.min(remaining, slab_size)

    amount_due += units_in_slab * parseFloat(slab.rate_per_unit)
    remaining -= units_in_slab
  }

  return parseFloat(amount_due.toFixed(2))
}

const generateInvoiceNo = async () => {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })

  const next = String((count || 0) + 1).padStart(5, '0')
  return `INV-${year}-${next}`
}

export const generateInvoice = async (reading_id) => {
  // get reading with meter and customer
  const { data: reading, error: readingError } = await supabase
    .from('readings')
    .select(`
      *,
      meters (
        id,
        serial_no,
        customers (id, customer_type)
      )
    `)
    .eq('id', reading_id)
    .single()

  if (readingError || !reading) throw new Error('Reading not found')

  // block invoice generation for flagged readings
  if (['flagged_ocr_mismatch', 'flagged_both', 'pending_review'].includes(reading.status)) {
    throw new Error('Cannot generate invoice for a flagged reading — resolve it first')
  }

  // check invoice does not already exist for this reading
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('reading_id', reading_id)
    .single()

  if (existingInvoice) throw new Error('Invoice already exists for this reading')

  const customer_id = reading.meters.customers.id
  const customer_type = reading.meters.customers.customer_type
  const units_consumed = parseFloat(reading.units_consumed)

  // get active tariffs
  const { data: tariffs, error: tariffError } = await supabase
    .from('tariffs')
    .select('*')
    .eq('is_active', true)

  if (tariffError || !tariffs.length) throw new Error('No active tariffs found')

  const amount_due = calculateAmount(units_consumed, customer_type, tariffs)
  const tax_amount = 0
  const total_amount = parseFloat((amount_due + tax_amount).toFixed(2))

  const invoice_no = await generateInvoiceNo()

  const billing_period_start = reading.reading_date
  const due_date = new Date(reading.reading_date)
  due_date.setDate(due_date.getDate() + 30)

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_no,
      customer_id,
      reading_id,
      units_consumed,
      amount_due,
      tax_amount,
      total_amount,
      status: 'unpaid',
      due_date: due_date.toISOString().split('T')[0],
      billing_period_start,
      billing_period_end: due_date.toISOString().split('T')[0],
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single()

  if (invoiceError) throw new Error(invoiceError.message)
  return invoice
}

export const getAll = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, account_no),
      readings (id, units_consumed, reading_date)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, account_no),
      readings (id, units_consumed, reading_date)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Invoice not found')
  return data
}

export const getByCustomerId = async (customer_id) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getOverdue = async () => {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, account_no)
    `)
    .in('status', ['unpaid', 'overdue'])
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export const updateStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}