import supabase from '../config/supabase.js'

export const getRevenueReport = async (from, to) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      customers (id, full_name, account_no),
      invoices (id, invoice_no)
    `)
    .eq('status', 'completed')
    .gte('payment_date', from)
    .lte('payment_date', to)
    .order('payment_date', { ascending: false })

  if (error) throw new Error(error.message)

  const total = data.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const by_method = {
    mpesa: data
      .filter(p => p.method === 'mpesa')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    bank_transfer: data
      .filter(p => p.method === 'bank_transfer')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    cash: data
      .filter(p => p.method === 'cash')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
  }

  return {
    from,
    to,
    total_collected: parseFloat(total.toFixed(2)),
    total_transactions: data.length,
    by_method,
    payments: data
  }
}

export const getConsumptionReport = async (from, to) => {
  const { data, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (
        id,
        serial_no,
        customers (id, full_name, account_no, customer_type)
      )
    `)
    .gte('reading_date', from)
    .lte('reading_date', to)
    .order('reading_date', { ascending: false })

  if (error) throw new Error(error.message)

  const total_units = data.reduce((sum, r) => sum + parseFloat(r.units_consumed || 0), 0)

  // group by customer_type
  const domestic = data.filter(r => r.meters?.customers?.customer_type === 'domestic')
  const commercial = data.filter(r => r.meters?.customers?.customer_type === 'commercial')

  return {
    from,
    to,
    total_units_consumed: parseFloat(total_units.toFixed(2)),
    total_readings: data.length,
    by_type: {
      domestic: {
        count: domestic.length,
        units: parseFloat(domestic.reduce((sum, r) => sum + parseFloat(r.units_consumed || 0), 0).toFixed(2))
      },
      commercial: {
        count: commercial.length,
        units: parseFloat(commercial.reduce((sum, r) => sum + parseFloat(r.units_consumed || 0), 0).toFixed(2))
      }
    },
    readings: data
  }
}

export const getDefaultersReport = async () => {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, email, account_no)
    `)
    .in('status', ['unpaid', 'overdue'])
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)

  const total_outstanding = data.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)

  return {
    total_defaulters: data.length,
    total_outstanding: parseFloat(total_outstanding.toFixed(2)),
    invoices: data
  }
}

export const getFlaggedReadingsReport = async () => {
  const { data, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (
        id,
        serial_no,
        customers (id, full_name, account_no)
      ),
      users!readings_submitted_by_fkey (id, full_name)
    `)
    .in('status', ['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const by_status = {
    flagged_ocr_mismatch: data.filter(r => r.status === 'flagged_ocr_mismatch').length,
    flagged_anomaly: data.filter(r => r.status === 'flagged_anomaly').length,
    flagged_both: data.filter(r => r.status === 'flagged_both').length,
    pending_review: data.filter(r => r.status === 'pending_review').length
  }

  return {
    total_flagged: data.length,
    by_status,
    readings: data
  }
}

export const getSummaryReport = async () => {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  // total customers
  const { count: total_customers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // total meters
  const { count: total_meters } = await supabase
    .from('meters')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // revenue this month
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')
    .gte('payment_date', firstOfMonth)

  const revenue_this_month = payments
    ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    : 0

  // unpaid invoices
  const { count: unpaid_invoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .in('status', ['unpaid', 'overdue'])

  // overdue invoices
  const { count: overdue_invoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .in('status', ['unpaid', 'overdue'])
    .lt('due_date', today)

  // flagged readings
  const { count: flagged_readings } = await supabase
    .from('readings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'])

  return {
    total_customers,
    total_meters,
    revenue_this_month: parseFloat(revenue_this_month.toFixed(2)),
    unpaid_invoices,
    overdue_invoices,
    flagged_readings
  }
}