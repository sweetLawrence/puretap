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

// export const initiateStkPush = async (invoice_id, phone) => {
//   const { data: invoice, error } = await supabase
//     .from('invoices')
//     .select(`*, customers (id, full_name, phone)`)
//     .eq('id', invoice_id)
//     .single()

//   if (error || !invoice) throw new Error('Invoice not found')
//   if (invoice.status === 'paid') throw new Error('Invoice is already paid')

//   const token = await getMpesaToken()

//   const timestamp = new Date()
//     .toISOString()
//     .replace(/[-T:.Z]/g, '')
//     .slice(0, 14)

//   const password = Buffer.from(
//     `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
//   ).toString('base64')

//   const mpesa_phone = phone.replace('+', '')

//   const { data: stkResponse } = await axios.post(
//     'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
//     {
//       BusinessShortCode: process.env.MPESA_SHORTCODE,
//       Password: password,
//       Timestamp: timestamp,
//       TransactionType: 'CustomerPayBillOnline',
//       Amount: Math.ceil(invoice.total_amount),
//       PartyA: mpesa_phone,
//       PartyB: process.env.MPESA_SHORTCODE,
//       PhoneNumber: mpesa_phone,
//       CallBackURL: process.env.MPESA_CALLBACK_URL,
//       AccountReference: invoice.invoice_no,
//       TransactionDesc: `Payment for ${invoice.invoice_no}`
//     },
//     { headers: { Authorization: `Bearer ${token}` } }
//   )

//   // save pending payment record
//   const { data: payment, error: paymentError } = await supabase
//     .from('payments')
//     .insert({
//       invoice_id,
//       customer_id: invoice.customer_id,
//       amount: invoice.total_amount,
//       method: 'mpesa',
//       status: 'pending',
//       mpesa_phone: phone,
//       payment_date: new Date(),
//       created_at: new Date(),
//       updated_at: new Date()
//     })
//     .select()
//     .single()

//   if (paymentError) throw new Error(paymentError.message)

//   return { payment, stkResponse }
// }


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

  console.log('MPESA PAYLOAD:', {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Timestamp: timestamp,
    Amount: Math.ceil(invoice.total_amount),
    PartyA: mpesa_phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: mpesa_phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: invoice.invoice_no,
  })

  try {
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

    console.log('MPESA RESPONSE:', stkResponse)

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

  } catch (err) {
    console.error('MPESA ERROR FULL:', err.response?.data)
    throw new Error(err.response?.data?.errorMessage || err.message)
  }
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







// 11th May 2026: Added getByInvoiceId for easier reconciliation

export const settleInvoice = async (invoice_id, amount_paid, customer_id, mpesa_ref = null) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single()

  if (!invoice) throw new Error('Invoice not found')

  const invoiceTotal = Number(invoice.total_amount)
  const paid = Number(amount_paid)
  const diff = parseFloat((paid - invoiceTotal).toFixed(2))

  // mark invoice paid
  await supabase.from('invoices')
    .update({ status: 'paid' })
    .eq('id', invoice_id)

  // fetch current credit
  const { data: customer } = await supabase
    .from('customers')
    .select('credit_balance')
    .eq('id', customer_id)
    .single()

  const currentCredit = Number(customer?.credit_balance || 0)

  if (diff > 0) {
    // OVERPAYMENT — add credit
    const newCredit = parseFloat((currentCredit + diff).toFixed(2))
    await supabase.from('customers')
      .update({ credit_balance: newCredit })
      .eq('id', customer_id)

    await supabase.from('credit_transactions').insert({
      customer_id,
      amount: diff,
      type: 'credit_added',
      reference: invoice.invoice_no,
      description: `Overpayment of KES ${diff} on ${invoice.invoice_no} — carried forward`
    })

    console.log(`Overpayment: KES ${diff} added to credit for customer ${customer_id}`)

  } else if (diff < 0) {
    // UNDERPAYMENT — carry shortfall as outstanding on invoice
    const shortfall = Math.abs(diff)
    await supabase.from('invoices')
      .update({
        status: 'unpaid',   // keep unpaid since not fully settled
        shortfall: shortfall
      })
      .eq('id', invoice_id)

    await supabase.from('credit_transactions').insert({
      customer_id,
      amount: shortfall,
      type: 'shortfall_carried',
      reference: invoice.invoice_no,
      description: `Underpayment of KES ${shortfall} on ${invoice.invoice_no} — balance remaining`
    })

    console.log(`Underpayment: KES ${shortfall} shortfall on invoice ${invoice.invoice_no}`)
  }
}