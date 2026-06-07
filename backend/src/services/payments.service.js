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



// Update your initiateStkPush function to accept amount parameter
// export const initiateStkPush = async (invoice_id, phone, customAmount = null) => {
//   const { data: invoice, error } = await supabase
//     .from('invoices')
//     .select(`*, customers (id, full_name, phone)`)
//     .eq('id', invoice_id)
//     .single()

//   if (error || !invoice) throw new Error('Invoice not found')
//   if (invoice.status === 'paid') throw new Error('Invoice is already paid')

//   // Use custom amount if provided, otherwise use full invoice amount
//   const amountToPay = customAmount ? Number(customAmount) : Number(invoice.total_amount)
  
//   if (amountToPay <= 0) throw new Error('Payment amount must be greater than 0')
  
//   // For partial payments, ensure amount doesn't exceed invoice total
//   if (customAmount && amountToPay > Number(invoice.total_amount)) {
//     throw new Error(`Amount cannot exceed invoice total of KES ${Number(invoice.total_amount).toLocaleString()}`)
//   }

//   const token = await getMpesaToken()

//   const timestamp = new Date()
//     .toISOString()
//     .replace(/[-T:.Z]/g, '')
//     .slice(0, 14)

//   const password = Buffer.from(
//     `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
//   ).toString('base64')

//   const mpesa_phone = phone.replace('+', '')

//   console.log('MPESA PAYLOAD:', {
//     BusinessShortCode: process.env.MPESA_SHORTCODE,
//     Timestamp: timestamp,
//     Amount: Math.ceil(amountToPay),  // Use amountToPay instead of invoice.total_amount
//     PartyA: mpesa_phone,
//     PartyB: process.env.MPESA_SHORTCODE,
//     PhoneNumber: mpesa_phone,
//     CallBackURL: process.env.MPESA_CALLBACK_URL,
//     AccountReference: invoice.invoice_no,
//   })

//   try {
//     const { data: stkResponse } = await axios.post(
//       'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
//       {
//         BusinessShortCode: process.env.MPESA_SHORTCODE,
//         Password: password,
//         Timestamp: timestamp,
//         TransactionType: 'CustomerPayBillOnline',
//         Amount: Math.ceil(amountToPay),  // Use amountToPay here too
//         PartyA: mpesa_phone,
//         PartyB: process.env.MPESA_SHORTCODE,
//         PhoneNumber: mpesa_phone,
//         CallBackURL: process.env.MPESA_CALLBACK_URL,
//         AccountReference: invoice.invoice_no,
//         TransactionDesc: `Payment for ${invoice.invoice_no}`
//       },
//       { headers: { Authorization: `Bearer ${token}` } }
//     )

//     console.log('MPESA RESPONSE:', stkResponse)

//     // Save payment record with the actual amount being paid
//     const { data: payment, error: paymentError } = await supabase
//       .from('payments')
//       .insert({
//         invoice_id,
//         customer_id: invoice.customer_id,
//         amount: amountToPay,  // Store the partial amount, not full invoice amount
//         method: 'mpesa',
//         status: 'pending',
//         mpesa_phone: phone,
//         payment_date: new Date(),
//         created_at: new Date(),
//         updated_at: new Date()
//       })
//       .select()
//       .single()

//     if (paymentError) throw new Error(paymentError.message)
//     return { payment, stkResponse }

//   } catch (err) {
//     console.error('MPESA ERROR FULL:', err.response?.data)
//     throw new Error(err.response?.data?.errorMessage || err.message)
//   }
// }


// Update initiateStkPush function - remove the paid check that blocks partial payments
// export const initiateStkPush = async (invoice_id, phone, customAmount = null) => {
//   const { data: invoice, error } = await supabase
//     .from('invoices')
//     .select(`*, customers (id, full_name, phone)`)
//     .eq('id', invoice_id)
//     .single()

//   if (error || !invoice) throw new Error('Invoice not found')
  
//   // FIX: Don't block if invoice is paid - check remaining balance instead
//   // Get current payments to calculate remaining balance
//   const { data: existingPayments } = await supabase
//     .from('payments')
//     .select('amount')
//     .eq('invoice_id', invoice_id)
//     .eq('status', 'completed')
  
//   const totalPaidSoFar = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
//   const currentRemaining = Number(invoice.total_amount) - totalPaidSoFar
  
//   if (currentRemaining <= 0) throw new Error('Invoice is fully paid')

//   // Use custom amount if provided, otherwise use remaining balance
//   const amountToPay = customAmount ? Number(customAmount) : currentRemaining
  
//   if (amountToPay <= 0) throw new Error('Payment amount must be greater than 0')
  
//   // Ensure amount doesn't exceed remaining balance
//   if (amountToPay > currentRemaining) {
//     throw new Error(`Amount cannot exceed remaining balance of KES ${currentRemaining.toLocaleString()}`)
//   }

//   const token = await getMpesaToken()

//   const timestamp = new Date()
//     .toISOString()
//     .replace(/[-T:.Z]/g, '')
//     .slice(0, 14)

//   const password = Buffer.from(
//     `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
//   ).toString('base64')

//   const mpesa_phone = phone.replace('+', '')

//   try {
//     const { data: stkResponse } = await axios.post(
//       'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
//       {
//         BusinessShortCode: process.env.MPESA_SHORTCODE,
//         Password: password,
//         Timestamp: timestamp,
//         TransactionType: 'CustomerPayBillOnline',
//         Amount: Math.ceil(amountToPay),
//         PartyA: mpesa_phone,
//         PartyB: process.env.MPESA_SHORTCODE,
//         PhoneNumber: mpesa_phone,
//         CallBackURL: process.env.MPESA_CALLBACK_URL,
//         AccountReference: invoice.invoice_no,
//         TransactionDesc: `Payment for ${invoice.invoice_no}`
//       },
//       { headers: { Authorization: `Bearer ${token}` } }
//     )

//     // Save payment record with the actual amount being paid
//     const { data: payment, error: paymentError } = await supabase
//       .from('payments')
//       .insert({
//         invoice_id,
//         customer_id: invoice.customer_id,
//         amount: amountToPay,
//         method: 'mpesa',
//         status: 'pending',
//         mpesa_phone: phone,
//         payment_date: new Date(),
//         created_at: new Date(),
//         updated_at: new Date()
//       })
//       .select()
//       .single()

//     if (paymentError) throw new Error(paymentError.message)
//     return { payment, stkResponse }

//   } catch (err) {
//     console.error('MPESA ERROR FULL:', err.response?.data)
//     throw new Error(err.response?.data?.errorMessage || err.message)
//   }
// }

export const initiateStkPush = async (invoice_id, phone, customAmount = null) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`*, customers (id, full_name, phone)`)
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')
  
  // Get current payments to calculate remaining balance
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoice_id)
    .eq('status', 'successful')
  
  const totalPaidSoFar = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const currentRemaining = Number(invoice.total_amount) - totalPaidSoFar
  
  if (currentRemaining <= 0) throw new Error('Invoice is fully paid')

  // Use custom amount if provided, otherwise use remaining balance
  const amountToPay = customAmount ? Number(customAmount) : currentRemaining
  
  if (amountToPay <= 0) throw new Error('Payment amount must be greater than 0')
  
  // Ensure amount doesn't exceed remaining balance
  if (amountToPay > currentRemaining) {
    throw new Error(`Amount cannot exceed remaining balance of KES ${currentRemaining.toLocaleString()}`)
  }

  const token = await getMpesaToken()

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')

  // Store phone WITHOUT the + prefix for consistent matching
  const mpesa_phone = String(phone).replace(/^\+/, '')

  console.log('MPESA PAYLOAD:', {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Timestamp: timestamp,
    Amount: Math.ceil(amountToPay),
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
        Amount: Math.ceil(amountToPay),
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

    // Save payment record WITHOUT the + prefix for consistent matching
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id,
        customer_id: invoice.customer_id,
        amount: amountToPay,
        method: 'mpesa',
        status: 'pending',
        mpesa_phone: mpesa_phone, // Store without + prefix
        mpesa_ref: null,
        payment_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
      throw new Error(paymentError.message)
    }
    
    console.log('Payment record created:', payment.id)
    return { payment, stkResponse }

  } catch (err) {
    console.error('MPESA ERROR FULL:', err.response?.data || err.message)
    throw new Error(err.response?.data?.errorMessage || err.message)
  }
}








//EXPERIMENTAL
// export const mpesaCallback = async (callbackData) => {
//   const body = callbackData.Body.stkCallback
//   const resultCode = body.ResultCode
//   const metadata = body.CallbackMetadata?.Item || []

//   const mpesa_ref = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value
//   const amount = metadata.find(i => i.Name === 'Amount')?.Value
//   const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value

//   console.log('MPESA Callback - Processing:', { resultCode, mpesa_ref, amount, phone })

//   if (resultCode !== 0) {
//     await supabase
//       .from('payments')
//       .update({ status: 'failed', updated_at: new Date() })
//       .eq('mpesa_phone', `+${phone}`)
//       .eq('status', 'pending')
//     return { success: false }
//   }

//   // Find the pending payment
//   const { data: payment, error } = await supabase
//     .from('payments')
//     .select('*')
//     .eq('mpesa_phone', `+${phone}`)
//     .eq('status', 'pending')
//     .order('created_at', { ascending: false })
//     .limit(1)
//     .single()

//   if (error || !payment) {
//     console.error('Payment not found:', error)
//     return { success: false }
//   }

//   // Get current invoice data
//   const { data: invoice } = await supabase
//     .from('invoices')
//     .select('*')
//     .eq('id', payment.invoice_id)
//     .single()

//   if (!invoice) return { success: false }

//   // Get all completed payments for this invoice
//   const { data: allPayments } = await supabase
//     .from('payments')
//     .select('amount')
//     .eq('invoice_id', payment.invoice_id)
//     .eq('status', 'completed')

//   // Calculate total paid (including this payment)
//   const previousTotal = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
//   const thisPayment = Number(payment.amount)
//   const totalPaid = previousTotal + thisPayment
//   const invoiceTotal = Number(invoice.total_amount)
//   const remainingBalance = invoiceTotal - totalPaid

//   console.log('Payment calculation:', {
//     previousTotal,
//     thisPayment,
//     totalPaid,
//     invoiceTotal,
//     remainingBalance
//   })

//   // Update payment status
//   await supabase
//     .from('payments')
//     .update({
//       status: 'completed',
//       mpesa_ref,
//       updated_at: new Date()
//     })
//     .eq('id', payment.id)

//   // Determine new invoice status
//   let newStatus = invoice.status
//   if (remainingBalance <= 0) {
//     newStatus = 'paid'
//   } else if (totalPaid > 0 && remainingBalance > 0) {
//     newStatus = 'unpaid'  // Keep as unpaid for partial payments
//   }

//   // Update invoice with calculated values
//   await supabase
//     .from('invoices')
//     .update({
//       amount_paid: totalPaid,
//       remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
//       status: newStatus,
//       updated_at: new Date()
//     })
//     .eq('id', payment.invoice_id)

//   // Record credit transaction
//   await supabase
//     .from('credit_transactions')
//     .insert({
//       customer_id: payment.customer_id,
//       amount: thisPayment,
//       type: totalPaid >= invoiceTotal ? 'payment_made' : 'partial_payment',
//       reference: invoice.invoice_no,
//       description: totalPaid >= invoiceTotal 
//         ? `Payment of KES ${thisPayment} completed invoice ${invoice.invoice_no}`
//         : `Partial payment of KES ${thisPayment} received. Remaining: KES ${remainingBalance}`,
//       created_at: new Date()
//     })

//   console.log('Invoice updated:', {
//     invoice_id: payment.invoice_id,
//     amount_paid: totalPaid,
//     remaining_balance: remainingBalance,
//     status: newStatus
//   })

//   return { success: true, mpesa_ref, amount }
// }


// export const mpesaCallback = async (callbackData) => {
//   const body = callbackData.Body.stkCallback
//   const resultCode = body.ResultCode
//   const metadata = body.CallbackMetadata?.Item || []

//   const mpesa_ref = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value
//   const amount = metadata.find(i => i.Name === 'Amount')?.Value
//   const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value

//   console.log('MPESA Callback - Processing:', { resultCode, mpesa_ref, amount, phone })

//   if (resultCode !== 0) {
//     await supabase
//       .from('payments')
//       .update({ status: 'failed', updated_at: new Date() })
//       .eq('mpesa_phone', `+${phone}`)
//       .eq('status', 'pending')
//     return { success: false }
//   }

//   // Find the pending payment - use mpesa_ref if available, otherwise use phone and amount
//   let paymentQuery = supabase
//     .from('payments')
//     .select('*')
//     .eq('status', 'pending')
//     .order('created_at', { ascending: false })
  
//   if (mpesa_ref) {
//     paymentQuery = paymentQuery.eq('mpesa_ref', mpesa_ref)
//   } else {
//     paymentQuery = paymentQuery.eq('mpesa_phone', `+${phone}`).eq('amount', amount)
//   }
  
//   const { data: payment, error } = await paymentQuery.limit(1).single()

//   if (error || !payment) {
//     console.error('Payment not found:', error)
//     return { success: false }
//   }

//   // Get current invoice data
//   const { data: invoice } = await supabase
//     .from('invoices')
//     .select('*')
//     .eq('id', payment.invoice_id)
//     .single()

//   if (!invoice) return { success: false }

//   // Get all completed payments for this invoice (excluding current one)
//   const { data: allPayments } = await supabase
//     .from('payments')
//     .select('amount')
//     .eq('invoice_id', payment.invoice_id)
//     .eq('status', 'completed')

//   // Calculate total paid (including this payment)
//   const previousTotal = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
//   const thisPayment = Number(payment.amount)
//   const totalPaid = previousTotal + thisPayment
//   const invoiceTotal = Number(invoice.total_amount)
//   const remainingBalance = invoiceTotal - totalPaid

//   console.log('Payment calculation:', {
//     previousTotal,
//     thisPayment,
//     totalPaid,
//     invoiceTotal,
//     remainingBalance
//   })

//   // Update payment status to SUCCESSFUL (Issue 3 fix)
//   await supabase
//     .from('payments')
//     .update({
//       status: 'successful',  // Changed from 'completed' to 'successful'
//       mpesa_ref,
//       updated_at: new Date()
//     })
//     .eq('id', payment.id)

//   // Determine new invoice status
//   let newStatus = invoice.status
//   if (remainingBalance <= 0) {
//     newStatus = 'paid'
//   } else if (totalPaid > 0 && remainingBalance > 0) {
//     newStatus = 'partial'  // Use 'partial' status for partial payments
//   }

//   // Update invoice with calculated values
//   await supabase
//     .from('invoices')
//     .update({
//       amount_paid: totalPaid,
//       remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
//       status: newStatus,
//       updated_at: new Date()
//     })
//     .eq('id', payment.invoice_id)

//   // Record credit transaction
//   await supabase
//     .from('credit_transactions')
//     .insert({
//       customer_id: payment.customer_id,
//       amount: thisPayment,
//       type: totalPaid >= invoiceTotal ? 'payment_made' : 'partial_payment',
//       reference: invoice.invoice_no,
//       description: totalPaid >= invoiceTotal 
//         ? `Payment of KES ${thisPayment} completed invoice ${invoice.invoice_no}`
//         : `Partial payment of KES ${thisPayment} received. Remaining: KES ${remainingBalance}`,
//       created_at: new Date()
//     })

//   console.log('Invoice updated:', {
//     invoice_id: payment.invoice_id,
//     amount_paid: totalPaid,
//     remaining_balance: remainingBalance,
//     status: newStatus
//   })

//   return { success: true, mpesa_ref, amount }
// }




export const mpesaCallback = async (callbackData) => {
  const body = callbackData.Body.stkCallback
  const resultCode = body.ResultCode
  const metadata = body.CallbackMetadata?.Item || []

  const mpesa_ref = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value
  const amount = metadata.find(i => i.Name === 'Amount')?.Value
  const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value

  console.log('MPESA Callback - Processing:', { resultCode, mpesa_ref, amount, phone })

  if (resultCode !== 0) {
    // Update pending payments to failed
    await supabase
      .from('payments')
      .update({ status: 'failed', updated_at: new Date() })
      .eq('status', 'pending')
      .is('mpesa_ref', null)
    return { success: false }
  }

  // Try multiple ways to find the pending payment
  let payment = null
  let error = null

  // Method 1: Try with mpesa_ref first (if available)
  if (mpesa_ref) {
    const { data, error: err } = await supabase
      .from('payments')
      .select('*')
      .eq('mpesa_ref', mpesa_ref)
      .eq('status', 'pending')
      .maybeSingle()
    
    if (!err && data) {
      payment = data
      console.log('Found payment by mpesa_ref:', mpesa_ref)
    }
  }

  // Method 2: Try with phone number (with and without +)
  if (!payment && phone) {
    const phoneWithPlus = `+${phone}`
    const phoneWithoutPlus = String(phone).replace(/^\+/, '')
    
    console.log('Searching for payment with phone:', { phoneWithPlus, phoneWithoutPlus })
    
    const { data, error: err } = await supabase
      .from('payments')
      .select('*')
      .or(`mpesa_phone.eq.${phoneWithPlus},mpesa_phone.eq.${phoneWithoutPlus}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!err && data) {
      payment = data
      console.log('Found payment by phone:', payment.id)
    }
  }

  // Method 3: Try with amount and recent timeframe (last 5 minutes)
  if (!payment && amount) {
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
    
    const { data, error: err } = await supabase
      .from('payments')
      .select('*')
      .eq('amount', amount)
      .eq('status', 'pending')
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!err && data) {
      payment = data
      console.log('Found payment by amount and timeframe:', payment.id)
    }
  }

  // Method 4: Get the most recent pending payment as last resort
  if (!payment) {
    const { data, error: err } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!err && data) {
      payment = data
      console.log('Found most recent pending payment as fallback:', payment.id)
    }
  }

  if (!payment) {
    console.error('Payment not found after all search methods')
    return { success: false }
  }

  // Get current invoice data
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', payment.invoice_id)
    .single()

  if (!invoice) {
    console.error('Invoice not found for payment:', payment.invoice_id)
    return { success: false }
  }

  // Get all completed payments for this invoice (excluding current one)
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', payment.invoice_id)
    .eq('status', 'successful')

  // Calculate total paid (including this payment)
  const previousTotal = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const thisPayment = Number(payment.amount) || Number(amount) || 0
  const totalPaid = previousTotal + thisPayment
  const invoiceTotal = Number(invoice.total_amount)
  const remainingBalance = invoiceTotal - totalPaid

  console.log('Payment calculation:', {
    previousTotal,
    thisPayment,
    totalPaid,
    invoiceTotal,
    remainingBalance
  })

  // Update payment status to successful
  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status: 'successful',
      mpesa_ref: mpesa_ref || payment.mpesa_ref,
      updated_at: new Date()
    })
    .eq('id', payment.id)

  if (updatePaymentError) {
    console.error('Failed to update payment:', updatePaymentError)
  }

  // Determine new invoice status
  let newStatus = invoice.status
  if (remainingBalance <= 0) {
    newStatus = 'paid'
  } else if (totalPaid > 0 && remainingBalance > 0) {
    newStatus = 'partial'
  }

  // Update invoice with calculated values
  const { error: updateInvoiceError } = await supabase
    .from('invoices')
    .update({
      amount_paid: totalPaid,
      remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
      status: newStatus,
      updated_at: new Date()
    })
    .eq('id', payment.invoice_id)

  if (updateInvoiceError) {
    console.error('Failed to update invoice:', updateInvoiceError)
  }

  // Record credit transaction
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      customer_id: payment.customer_id,
      amount: thisPayment,
      type: remainingBalance <= 0 ? 'payment_made' : 'partial_payment',
      reference: invoice.invoice_no,
      description: remainingBalance <= 0 
        ? `Payment of KES ${thisPayment} completed invoice ${invoice.invoice_no}`
        : `Partial payment of KES ${thisPayment} received. Remaining: KES ${remainingBalance}`,
      created_at: new Date()
    })

  if (transactionError) {
    console.error('Failed to record credit transaction:', transactionError)
  }

  console.log('Invoice updated:', {
    invoice_id: payment.invoice_id,
    amount_paid: totalPaid,
    remaining_balance: remainingBalance,
    status: newStatus
  })

  return { success: true, mpesa_ref, amount: thisPayment }
}




// export const recordManual = async ({ invoice_id, amount, method, bank_ref, received_by }) => {
//   const { data: invoice, error } = await supabase
//     .from('invoices')
//     .select('*')
//     .eq('id', invoice_id)
//     .single()

//   if (error || !invoice) throw new Error('Invoice not found')
//   if (invoice.status === 'paid') throw new Error('Invoice is already paid')

//   const { data: payment, error: paymentError } = await supabase
//     .from('payments')
//     .insert({
//       invoice_id,
//       customer_id: invoice.customer_id,
//       amount,
//       method,
//       status: 'completed',
//       bank_ref: bank_ref || null,
//       received_by,
//       payment_date: new Date(),
//       created_at: new Date(),
//       updated_at: new Date()
//     })
//     .select()
//     .single()

//   if (paymentError) throw new Error(paymentError.message)

//   // mark invoice paid
//   await supabase
//     .from('invoices')
//     .update({ status: 'paid', updated_at: new Date() })
//     .eq('id', invoice_id)

//   return payment
// }


export const recordManual = async ({ invoice_id, amount, method, bank_ref, received_by }) => {
  // Get current invoice with payment info
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')
  
  // Get existing completed payments
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoice_id)
    .eq('status', 'successful')  // Changed from 'completed' to 'successful'
  
  const totalPaidSoFar = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const currentRemaining = Number(invoice.total_amount) - totalPaidSoFar
  
  if (currentRemaining <= 0) throw new Error('Invoice is fully paid')
  
  const paymentAmount = Number(amount)
  if (paymentAmount > currentRemaining) {
    throw new Error(`Amount cannot exceed remaining balance of KES ${currentRemaining.toLocaleString()}`)
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id,
      customer_id: invoice.customer_id,
      amount: paymentAmount,
      method,
      status: 'successful',  // Changed from 'completed' to 'successful'
      bank_ref: bank_ref || null,
      received_by,
      payment_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single()

  if (paymentError) throw new Error(paymentError.message)

  // Calculate new totals
  const newTotalPaid = totalPaidSoFar + paymentAmount
  const newRemaining = Number(invoice.total_amount) - newTotalPaid
  let newStatus = invoice.status
  
  if (newRemaining <= 0) {
    newStatus = 'paid'
  } else if (newTotalPaid > 0 && newRemaining > 0) {
    newStatus = 'partial'
  }

  // Update invoice
  await supabase
    .from('invoices')
    .update({ 
      status: newStatus,
      amount_paid: newTotalPaid,
      remaining_balance: newRemaining > 0 ? newRemaining : 0,
      updated_at: new Date() 
    })
    .eq('id', invoice_id)

  // Record credit transaction
  await supabase
    .from('credit_transactions')
    .insert({
      customer_id: invoice.customer_id,
      amount: paymentAmount,
      type: newRemaining <= 0 ? 'payment_made' : 'partial_payment',
      reference: invoice.invoice_no,
      description: newRemaining <= 0
        ? `Payment of KES ${paymentAmount} completed invoice ${invoice.invoice_no}`
        : `Partial payment of KES ${paymentAmount} received. Remaining: KES ${newRemaining}`,
      created_at: new Date()
    })

  return payment
}







// export const getAll = async () => {
//   const { data, error } = await supabase
//     .from('payments')
//     .select(`
//       *,
//       invoices (id, invoice_no, total_amount),
//       customers (id, full_name, phone, account_no)
//     `)
//     .order('created_at', { ascending: false })

//   if (error) throw new Error(error.message)
//   return data
// }

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
  
  // Map 'successful' to 'completed' for frontend display if needed
  // Or just return as is and update frontend to expect 'successful'
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











// Add these helper functions at the bottom of payments.service.js

export const getCustomerCreditBalance = async (customer_id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('credit_balance')
    .eq('id', customer_id)
    .single()
  
  if (error) throw new Error(error.message)
  return Number(data?.credit_balance || 0)
}

export const getCreditTransactions = async (customer_id, limit = 50) => {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw new Error(error.message)
  return data
}