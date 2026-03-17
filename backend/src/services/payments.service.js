import supabase from '../config/supabase.js'
import axios from 'axios'

const getMpesaToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const { data } = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  )

  return data.access_token
}

export const initiateStkPush = async (invoice_id, phone) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`*, customers (id, full_name, phone)`)
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')
  if (invoice.status === 'paid') throw new Error('Invoice is already paid')

  const token = await getMpesaToken()

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')

  const mpesa_phone = phone.replace('+', '')

  const { data: stkResponse } = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(invoice.total_amount),
      PartyA: mpesa_phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: mpesa_phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: invoice.invoice_no,
      TransactionDesc: `Payment for ${invoice.invoice_no}`
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )

  // save pending payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id,
      customer_id: invoice.customer_id,
      amount: invoice.total_amount,
      method: 'mpesa',
      status: 'pending',
      mpesa_phone: phone,
      payment_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single()

  if (paymentError) throw new Error(paymentError.message)

  return { payment, stkResponse }
}

export const mpesaCallback = async (callbackData) => {
  const body = callbackData.Body.stkCallback
  const resultCode = body.ResultCode
  const metadata = body.CallbackMetadata?.Item || []

  const mpesa_ref = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value
  const amount = metadata.find(i => i.Name === 'Amount')?.Value
  const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value

  if (resultCode !== 0) {
    // payment failed — update pending payment to failed
    await supabase
      .from('payments')
      .update({ status: 'failed', updated_at: new Date() })
      .eq('mpesa_phone', `+${phone}`)
      .eq('status', 'pending')

    return { success: false }
  }

  // find the pending payment by phone
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('mpesa_phone', `+${phone}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !payment) return { success: false }

  // mark payment completed
  await supabase
    .from('payments')
    .update({
      status: 'completed',
      mpesa_ref,
      updated_at: new Date()
    })
    .eq('id', payment.id)

  // mark invoice paid
  await supabase
    .from('invoices')
    .update({ status: 'paid', updated_at: new Date() })
    .eq('id', payment.invoice_id)

  return { success: true, mpesa_ref, amount }
}

export const recordManual = async ({ invoice_id, amount, method, bank_ref, received_by }) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')
  if (invoice.status === 'paid') throw new Error('Invoice is already paid')

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id,
      customer_id: invoice.customer_id,
      amount,
      method,
      status: 'completed',
      bank_ref: bank_ref || null,
      received_by,
      payment_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single()

  if (paymentError) throw new Error(paymentError.message)

  // mark invoice paid
  await supabase
    .from('invoices')
    .update({ status: 'paid', updated_at: new Date() })
    .eq('id', invoice_id)

  return payment
}

export const getAll = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoices (id, invoice_no, total_amount),
      customers (id, full_name, phone, account_no)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoices (id, invoice_no, total_amount),
      customers (id, full_name, phone, account_no)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Payment not found')
  return data
}

export const getByCustomerId = async (customer_id) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}