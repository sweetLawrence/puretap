import supabase from '../config/supabase.js'
import { sendMessage } from './sms.service.js'
import { sendEmail } from './email.service.js'

const notify = async (customer, subject, message, html) => {
  const results = { telegram: null, email: null }

  // send telegram if customer has chat_id
  if (customer.telegram_chat_id) {
    try {
      results.telegram = await sendMessage(customer.telegram_chat_id, message)
    } catch (err) {
      results.telegram = { error: err.message }
    }
  }

  // send email if customer has email
  if (customer.email) {
    try {
      results.email = await sendEmail(customer.email, subject, html || `<p>${message}</p>`)
    } catch (err) {
      results.email = { error: err.message }
    }
  }

  return results
}

export const sendInvoiceNotification = async (invoice_id) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, email, telegram_chat_id, account_no)
    `)
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')

  const { customers: customer } = invoice

  const subject = `PureTap — Invoice ${invoice.invoice_no}`

  const message =
    `Hi ${customer.full_name},\n\n` +
    `Your water bill for account <b>${customer.account_no}</b> is ready.\n\n` +
    `Invoice No: <b>${invoice.invoice_no}</b>\n` +
    `Units Consumed: <b>${invoice.units_consumed} m³</b>\n` +
    `Amount Due: <b>KES ${invoice.total_amount}</b>\n` +
    `Due Date: <b>${invoice.due_date}</b>\n\n` +
    `Please pay before the due date to avoid penalties.\n\n` +
    `Thank you,\nPureTap Water`

  const html = `
    <h2>PureTap Water Billing</h2>
    <p>Hi <strong>${customer.full_name}</strong>,</p>
    <p>Your water bill is ready.</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr><td>Invoice No</td><td>${invoice.invoice_no}</td></tr>
      <tr><td>Account No</td><td>${customer.account_no}</td></tr>
      <tr><td>Units Consumed</td><td>${invoice.units_consumed} m³</td></tr>
      <tr><td>Amount Due</td><td>KES ${invoice.total_amount}</td></tr>
      <tr><td>Due Date</td><td>${invoice.due_date}</td></tr>
    </table>
    <p>Please pay before the due date to avoid penalties.</p>
    <p>Thank you,<br/>PureTap Water</p>
  `

  return await notify(customer, subject, message, html)
}

export const sendPaymentConfirmation = async (payment_id) => {
  const { data: payment, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoices (id, invoice_no),
      customers (id, full_name, phone, email, telegram_chat_id, account_no)
    `)
    .eq('id', payment_id)
    .single()

  if (error || !payment) throw new Error('Payment not found')

  const { customers: customer, invoices: invoice } = payment

  const subject = `PureTap — Payment Received`

  const message =
    `Hi ${customer.full_name},\n\n` +
    `We have received your payment.\n\n` +
    `Invoice No: <b>${invoice.invoice_no}</b>\n` +
    `Amount Paid: <b>KES ${payment.amount}</b>\n` +
    `Method: <b>${payment.method}</b>\n` +
    (payment.mpesa_ref ? `M-Pesa Ref: <b>${payment.mpesa_ref}</b>\n` : '') +
    `\nThank you for your payment!\n\nPureTap Water`

  const html = `
    <h2>Payment Confirmation</h2>
    <p>Hi <strong>${customer.full_name}</strong>,</p>
    <p>We have received your payment. Thank you!</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr><td>Invoice No</td><td>${invoice.invoice_no}</td></tr>
      <tr><td>Amount Paid</td><td>KES ${payment.amount}</td></tr>
      <tr><td>Method</td><td>${payment.method}</td></tr>
      ${payment.mpesa_ref ? `<tr><td>M-Pesa Ref</td><td>${payment.mpesa_ref}</td></tr>` : ''}
    </table>
    <p>Thank you,<br/>PureTap Water</p>
  `

  return await notify(customer, subject, message, html)
}

export const sendOverdueReminder = async (invoice_id) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, email, telegram_chat_id, account_no)
    `)
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')

  const { customers: customer } = invoice

  const subject = `PureTap — Overdue Invoice ${invoice.invoice_no}`

  const message =
    `Hi ${customer.full_name},\n\n` +
    `This is a reminder that your water bill is <b>overdue</b>.\n\n` +
    `Invoice No: <b>${invoice.invoice_no}</b>\n` +
    `Amount Due: <b>KES ${invoice.total_amount}</b>\n` +
    `Due Date: <b>${invoice.due_date}</b>\n\n` +
    `Please pay immediately to avoid service interruption.\n\nPureTap Water`

  const html = `
    <h2>Overdue Invoice Reminder</h2>
    <p>Hi <strong>${customer.full_name}</strong>,</p>
    <p>Your water bill is <strong style="color:red">overdue</strong>.</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr><td>Invoice No</td><td>${invoice.invoice_no}</td></tr>
      <tr><td>Amount Due</td><td>KES ${invoice.total_amount}</td></tr>
      <tr><td>Due Date</td><td>${invoice.due_date}</td></tr>
    </table>
    <p>Please pay immediately to avoid service interruption.</p>
    <p>PureTap Water</p>
  `

  return await notify(customer, subject, message, html)
}

export const sendFlaggedReadingAlert = async (reading_id) => {
  // this one goes to admins not customers
  const { data: reading, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (serial_no, installation_address,
        customers (full_name, account_no)
      )
    `)
    .eq('id', reading_id)
    .single()

  if (error || !reading) throw new Error('Reading not found')

  // fetch all admins
  const { data: admins } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'admin')
    .eq('is_active', true)

  const subject = `PureTap — Flagged Reading Alert`

  const html = `
    <h2>Flagged Reading Alert</h2>
    <p>A reading has been flagged and requires your review.</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr><td>Reading ID</td><td>${reading.id}</td></tr>
      <tr><td>Meter</td><td>${reading.meters.serial_no}</td></tr>
      <tr><td>Customer</td><td>${reading.meters.customers.full_name}</td></tr>
      <tr><td>Account No</td><td>${reading.meters.customers.account_no}</td></tr>
      <tr><td>Status</td><td>${reading.status}</td></tr>
      <tr><td>Manual Value</td><td>${reading.manual_value}</td></tr>
      <tr><td>OCR Value</td><td>${reading.ocr_value || 'N/A'}</td></tr>
    </table>
    <p>Please log in to review this reading.</p>
  `

  const results = []
  for (const admin of admins) {
    try {
      const result = await sendEmail(admin.email, subject, html)
      results.push({ email: admin.email, result })
    } catch (err) {
      results.push({ email: admin.email, error: err.message })
    }
  }

  return results
}

// called by webhook when customer sends /start to bot
export const saveTelegramChatId = async (chat_id, phone) => {
  // try to match customer by phone
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, full_name')
    .eq('phone', phone)
    .single()

  if (error || !customer) return null

  await supabase
    .from('customers')
    .update({ telegram_chat_id: String(chat_id) })
    .eq('id', customer.id)

  return customer
}