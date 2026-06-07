// import supabase from '../config/supabase.js'
// import { sendMessage } from './sms.service.js'
// import { sendEmail } from './email.service.js'

// const notify = async (customer, subject, message, html) => {
//   const results = { telegram: null, email: null }

//   // send telegram if customer has chat_id
//   if (customer.telegram_chat_id) {
//     try {
//       results.telegram = await sendMessage(customer.telegram_chat_id, message)
//     } catch (err) {
//       results.telegram = { error: err.message }
//     }
//   }

//   // send email if customer has email
//   if (customer.email) {
//     try {
//       results.email = await sendEmail(customer.email, subject, html || `<p>${message}</p>`)
//     } catch (err) {
//       results.email = { error: err.message }
//     }
//   }

//   return results
// }

// export const sendInvoiceNotification = async (invoice_id) => {
//   const { data: invoice, error } = await supabase
//     .from('invoices')
//     .select(`
//       *,
//       customers (id, full_name, phone, email, telegram_chat_id, account_no)
//     `)
//     .eq('id', invoice_id)
//     .single()

//   if (error || !invoice) throw new Error('Invoice not found')

//   const { customers: customer } = invoice

//   const subject = `PureTap — Invoice ${invoice.invoice_no}`

//   const message =
//     `Hi ${customer.full_name},\n\n` +
//     `Your water bill for account <b>${customer.account_no}</b> is ready.\n\n` +
//     `Invoice No: <b>${invoice.invoice_no}</b>\n` +
//     `Units Consumed: <b>${invoice.units_consumed} m³</b>\n` +
//     `Amount Due: <b>KES ${invoice.total_amount}</b>\n` +
//     `Due Date: <b>${invoice.due_date}</b>\n\n` +
//     `Please pay before the due date to avoid penalties.\n\n` +
//     `Thank you,\nPureTap Water`

//   const html = `
//     <h2>PureTap Water Billing</h2>
//     <p>Hi <strong>${customer.full_name}</strong>,</p>
//     <p>Your water bill is ready.</p>
//     <table border="1" cellpadding="8" cellspacing="0">
//       <tr><td>Invoice No</td><td>${invoice.invoice_no}</td></tr>
//       <tr><td>Account No</td><td>${customer.account_no}</td></tr>
//       <tr><td>Units Consumed</td><td>${invoice.units_consumed} m³</td></tr>
//       <tr><td>Amount Due</td><td>KES ${invoice.total_amount}</td></tr>
//       <tr><td>Due Date</td><td>${invoice.due_date}</td></tr>
//     </table>
//     <p>Please pay before the due date to avoid penalties.</p>
//     <p>Thank you,<br/>PureTap Water</p>
//   `

//   return await notify(customer, subject, message, html)
// }

// export const sendPaymentConfirmation = async (payment_id) => {
//   const { data: payment, error } = await supabase
//     .from('payments')
//     .select(`
//       *,
//       invoices (id, invoice_no),
//       customers (id, full_name, phone, email, telegram_chat_id, account_no)
//     `)
//     .eq('id', payment_id)
//     .single()

//   if (error || !payment) throw new Error('Payment not found')

//   const { customers: customer, invoices: invoice } = payment

//   const subject = `PureTap — Payment Received`

//   const message =
//     `Hi ${customer.full_name},\n\n` +
//     `We have received your payment.\n\n` +
//     `Invoice No: <b>${invoice.invoice_no}</b>\n` +
//     `Amount Paid: <b>KES ${payment.amount}</b>\n` +
//     `Method: <b>${payment.method}</b>\n` +
//     (payment.mpesa_ref ? `M-Pesa Ref: <b>${payment.mpesa_ref}</b>\n` : '') +
//     `\nThank you for your payment!\n\nPureTap Water`

//   const html = `
//     <h2>Payment Confirmation</h2>
//     <p>Hi <strong>${customer.full_name}</strong>,</p>
//     <p>We have received your payment. Thank you!</p>
//     <table border="1" cellpadding="8" cellspacing="0">
//       <tr><td>Invoice No</td><td>${invoice.invoice_no}</td></tr>
//       <tr><td>Amount Paid</td><td>KES ${payment.amount}</td></tr>
//       <tr><td>Method</td><td>${payment.method}</td></tr>
//       ${payment.mpesa_ref ? `<tr><td>M-Pesa Ref</td><td>${payment.mpesa_ref}</td></tr>` : ''}
//     </table>
//     <p>Thank you,<br/>PureTap Water</p>
//   `

//   return await notify(customer, subject, message, html)
// }

// export const sendOverdueReminder = async (invoice_id) => {
//   const { data: invoice, error } = await supabase
//     .from('invoices')
//     .select(`
//       *,
//       customers (id, full_name, phone, email, telegram_chat_id, account_no)
//     `)
//     .eq('id', invoice_id)
//     .single()

//   if (error || !invoice) throw new Error('Invoice not found')

//   const { customers: customer } = invoice

//   const subject = `PureTap — Overdue Invoice ${invoice.invoice_no}`

//   const message =
//     `Hi ${customer.full_name},\n\n` +
//     `This is a reminder that your water bill is <b>overdue</b>.\n\n` +
//     `Invoice No: <b>${invoice.invoice_no}</b>\n` +
//     `Amount Due: <b>KES ${invoice.total_amount}</b>\n` +
//     `Due Date: <b>${invoice.due_date}</b>\n\n` +
//     `Please pay immediately to avoid service interruption.\n\nPureTap Water`

//   const html = `
//     <h2>Overdue Invoice Reminder</h2>
//     <p>Hi <strong>${customer.full_name}</strong>,</p>
//     <p>Your water bill is <strong style="color:red">overdue</strong>.</p>
//     <table border="1" cellpadding="8" cellspacing="0">
//       <tr><td>Invoice No</td><td>${invoice.invoice_no}</td></tr>
//       <tr><td>Amount Due</td><td>KES ${invoice.total_amount}</td></tr>
//       <tr><td>Due Date</td><td>${invoice.due_date}</td></tr>
//     </table>
//     <p>Please pay immediately to avoid service interruption.</p>
//     <p>PureTap Water</p>
//   `

//   return await notify(customer, subject, message, html)
// }

// export const sendFlaggedReadingAlert = async (reading_id) => {
//   // this one goes to admins not customers
//   const { data: reading, error } = await supabase
//     .from('readings')
//     .select(`
//       *,
//       meters (serial_no, installation_address,
//         customers (full_name, account_no)
//       )
//     `)
//     .eq('id', reading_id)
//     .single()

//   if (error || !reading) throw new Error('Reading not found')

//   // fetch all admins
//   const { data: admins } = await supabase
//     .from('users')
//     .select('email')
//     .eq('role', 'admin')
//     .eq('is_active', true)

//   const subject = `PureTap — Flagged Reading Alert`

//   const html = `
//     <h2>Flagged Reading Alert</h2>
//     <p>A reading has been flagged and requires your review.</p>
//     <table border="1" cellpadding="8" cellspacing="0">
//       <tr><td>Reading ID</td><td>${reading.id}</td></tr>
//       <tr><td>Meter</td><td>${reading.meters.serial_no}</td></tr>
//       <tr><td>Customer</td><td>${reading.meters.customers.full_name}</td></tr>
//       <tr><td>Account No</td><td>${reading.meters.customers.account_no}</td></tr>
//       <tr><td>Status</td><td>${reading.status}</td></tr>
//       <tr><td>Manual Value</td><td>${reading.manual_value}</td></tr>
//       <tr><td>OCR Value</td><td>${reading.ocr_value || 'N/A'}</td></tr>
//     </table>
//     <p>Please log in to review this reading.</p>
//   `

//   const results = []
//   for (const admin of admins) {
//     try {
//       const result = await sendEmail(admin.email, subject, html)
//       results.push({ email: admin.email, result })
//     } catch (err) {
//       results.push({ email: admin.email, error: err.message })
//     }
//   }

//   return results
// }

// // called by webhook when customer sends /start to bot
// export const saveTelegramChatId = async (chat_id, phone) => {
//   // try to match customer by phone
//   const { data: customer, error } = await supabase
//     .from('customers')
//     .select('id, full_name')
//     .eq('phone', phone)
//     .single()

//   if (error || !customer) return null

//   await supabase
//     .from('customers')
//     .update({ telegram_chat_id: String(chat_id) })
//     .eq('id', customer.id)

//   return customer
// }










import supabase from '../config/supabase.js'
import { sendEmail } from './email.service.js'

const notify = async (customer, subject, html) => {
  const results = { email: null }

  // send email if customer has email
  if (customer.email) {
    try {
      results.email = await sendEmail(customer.email, subject, html)
    } catch (err) {
      results.email = { error: err.message }
    }
  }

  return results
}

// Helper function to calculate payment totals for an invoice
const calculateInvoicePaymentTotals = async (invoiceId) => {
  // Get all successful payments for this invoice
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status')
    .eq('invoice_id', invoiceId)
    .eq('status', 'successful')  // Using 'successful' status

  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  return { totalPaid, payments: payments || [] }
}

export const sendInvoiceNotification = async (invoice_id) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, email, account_no)
    `)
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')

  const { customers: customer } = invoice
  
  // Calculate payment totals for this invoice
  const { totalPaid, payments } = await calculateInvoicePaymentTotals(invoice_id)
  const totalAmount = Number(invoice.total_amount)
  const remainingBalance = totalAmount - totalPaid
  const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0 && invoice.status !== 'paid'
  const percentPaid = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const subject = `PureTap — Invoice ${invoice.invoice_no}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1E4A6B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0e0e0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
        .total { font-size: 18px; font-weight: bold; color: #1E4A6B; }
        .paid { color: #2E7D32; }
        .partial { color: #ED6C02; }
        .remaining { color: #D32F2F; }
        .footer { margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-unpaid { background: #FEF3C7; color: #B45309; }
        .badge-partial { background: #FEF3C7; color: #ED6C02; }
        .badge-paid { background: #E8F5E9; color: #2E7D32; }
        .badge-overdue { background: #FEF2F2; color: #D32F2F; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>PureTap Water Billing</h2>
          <p>${invoice.invoice_no}</p>
        </div>
        <div class="content">
          <p>Hi <strong>${customer.full_name}</strong>,</p>
          <p>Your water bill is ready. Please find the details below:</p>
          
          <div class="invoice-details">
            <table>
              <tr>
                <th>Invoice No</th>
                <td><strong>${invoice.invoice_no}</strong></td>
              </tr>
              <tr>
                <th>Account No</th>
                <td>${customer.account_no}</td>
              </tr>
              <tr>
                <th>Billing Period</th>
                <td>${invoice.billing_period_start} — ${invoice.billing_period_end}</td>
              </tr>
              <tr>
                <th>Units Consumed</th>
                <td>${invoice.units_consumed} m³</td>
              </tr>
              <tr>
                <th>Due Date</th>
                <td><strong>${invoice.due_date}</strong></td>
              </tr>
            </table>
          </div>

          <div class="invoice-details">
            <table>
              <tr>
                <th>Description</th>
                <th class="amount">Amount (KES)</th>
              </tr>
              <tr>
                <td>Water consumption charge</td>
                <td class="amount">${Number(invoice.amount_due).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Tax</td>
                <td class="amount">${Number(invoice.tax_amount).toLocaleString()}</td>
              </tr>
              <tr style="background: #f5f5f5;">
                <th>TOTAL AMOUNT</th>
                <th class="amount total">${totalAmount.toLocaleString()}</th>
              </tr>
            </table>
          </div>

          ${totalPaid > 0 ? `
            <div class="invoice-details">
              <table>
                <tr>
                  <th>Payment Summary</th>
                  <th class="amount">Amount (KES)</th>
                </tr>
                <tr>
                  <td>Amount Paid</td>
                  <td class="amount paid"><strong>- ${totalPaid.toLocaleString()}</strong></td>
                </tr>
                ${isPartiallyPaid ? `
                  <tr>
                    <td>Remaining Balance</td>
                    <td class="amount remaining"><strong>${remainingBalance.toLocaleString()}</strong></td>
                  </tr>
                  <tr>
                    <td>Payment Progress</td>
                    <td class="amount partial"><strong>${percentPaid}% Paid</strong></td>
                  </tr>
                ` : ''}
              </table>
            </div>
          ` : ''}

          <div style="margin: 20px 0;">
            ${isPartiallyPaid ? `
              <span class="badge badge-partial">PARTIAL PAID (${percentPaid}%)</span>
            ` : invoice.status === 'paid' ? `
              <span class="badge badge-paid">PAID</span>
            ` : invoice.status === 'overdue' ? `
              <span class="badge badge-overdue">OVERDUE</span>
            ` : `
              <span class="badge badge-unpaid">UNPAID</span>
            `}
          </div>

          ${isPartiallyPaid && remainingBalance > 0 ? `
            <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; color: #ED6C02;">
                <strong>⚠️ Partial Payment Alert</strong><br>
                You have paid ${percentPaid}% of this invoice. 
                The remaining balance of <strong>KES ${remainingBalance.toLocaleString()}</strong> is due by <strong>${invoice.due_date}</strong>.
              </p>
            </div>
          ` : remainingBalance > 0 && invoice.status === 'unpaid' ? `
            <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; color: #B45309;">
                <strong>⚠️ Payment Required</strong><br>
                Please pay <strong>KES ${remainingBalance.toLocaleString()}</strong> before <strong>${invoice.due_date}</strong> to avoid penalties.
              </p>
            </div>
          ` : ''}

          ${payments && payments.length > 0 ? `
            <div class="invoice-details">
              <h4>Payment History</h4>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th class="amount">Amount (KES)</th>
                </tr>
                ${payments.map(p => `
                  <tr>
                    <td>${new Date(p.payment_date).toLocaleDateString()}</td>
                    <td>${p.method === 'mpesa' ? 'M-Pesa' : p.method === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}</td>
                    <td class="amount">${Number(p.amount).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}

          <div style="background: #E6F1FB; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1E4A6B;">Payment Instructions</h4>
            <p style="margin: 5px 0;">Pay via M-Pesa Paybill or through the PureTap customer portal.</p>
            <p style="margin: 5px 0;">Quote your account number <strong>${customer.account_no}</strong> as the reference when paying.</p>
          </div>

          <div class="footer">
            <p>Thank you for choosing PureTap Water</p>
            <p>For support, please contact your water supplier</p>
            <p style="font-size: 10px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await notify(customer, subject, html)
}

export const sendPaymentConfirmation = async (payment_id) => {
  const { data: payment, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoices (id, invoice_no, total_amount, due_date, billing_period_start, billing_period_end, status),
      customers (id, full_name, phone, email, account_no)
    `)
    .eq('id', payment_id)
    .single()

  if (error || !payment) throw new Error('Payment not found')

  const { customers: customer, invoices: invoice } = payment

  // Calculate updated totals for the invoice after this payment
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoice.id)
    .eq('status', 'successful')

  const totalPaid = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const totalAmount = Number(invoice.total_amount)
  const remainingBalance = totalAmount - totalPaid
  const isFullyPaid = remainingBalance === 0
  const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0 && invoice.status !== 'paid'
  const percentPaid = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const subject = `PureTap — Payment Confirmation`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1E4A6B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .payment-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0e0e0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
        .total { font-size: 18px; font-weight: bold; color: #1E4A6B; }
        .success { color: #2E7D32; }
        .warning { color: #ED6C02; }
        .footer { margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #E8F5E9; color: #2E7D32; }
        .badge-partial { background: #FEF3C7; color: #ED6C02; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>PureTap Water Billing</h2>
          <p>Payment Confirmation</p>
        </div>
        <div class="content">
          <p>Hi <strong>${customer.full_name}</strong>,</p>
          <p>We have received your payment. Thank you for your prompt payment!</p>
          
          <div class="payment-details">
            <table>
              <tr>
                <th>Invoice No</th>
                <td><strong>${invoice.invoice_no}</strong></td>
              </tr>
              <tr>
                <th>Account No</th>
                <td>${customer.account_no}</td>
              </tr>
              <tr>
                <th>Amount Paid</th>
                <td class="amount success"><strong>KES ${Number(payment.amount).toLocaleString()}</strong></td>
              </tr>
              <tr>
                <th>Payment Method</th>
                <td>${payment.method === 'mpesa' ? 'M-Pesa' : payment.method === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}</td>
              </tr>
              ${payment.mpesa_ref ? `
                <tr>
                  <th>M-Pesa Reference</th>
                  <td>${payment.mpesa_ref}</td>
                </tr>
              ` : ''}
              ${payment.bank_ref ? `
                <tr>
                  <th>Bank Reference</th>
                  <td>${payment.bank_ref}</td>
                </tr>
              ` : ''}
              <tr>
                <th>Payment Date</th>
                <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>

          <div class="payment-details">
            <table>
              <tr>
                <th>Invoice Total</th>
                <td class="amount">KES ${totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <th>Total Paid to Date</th>
                <td class="amount success"><strong>KES ${totalPaid.toLocaleString()}</strong></td>
              </tr>
              ${!isFullyPaid ? `
                <tr>
                  <th>Remaining Balance</th>
                  <td class="amount warning"><strong>KES ${remainingBalance.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <th>Payment Progress</th>
                  <td class="amount warning"><strong>${percentPaid}% Paid</strong></td>
                </tr>
              ` : ''}
            </table>
          </div>

          <div style="margin: 20px 0;">
            ${isFullyPaid ? `
              <span class="badge badge-success">✓ FULLY PAID</span>
              <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; color: #2E7D32;">
                  <strong>✅ Invoice Fully Paid</strong><br>
                  Thank you for clearing your invoice in full.
                </p>
              </div>
            ` : isPartiallyPaid ? `
              <span class="badge badge-partial">PARTIAL PAYMENT (${percentPaid}%)</span>
              <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="margin: 0; color: #ED6C02;">
                  <strong>⚠️ Partial Payment Received</strong><br>
                  You have a remaining balance of <strong>KES ${remainingBalance.toLocaleString()}</strong>. 
                  Please pay the remaining amount by <strong>${invoice.due_date}</strong>.
                </p>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for choosing PureTap Water</p>
            <p>For support, please contact your water supplier</p>
            <p style="font-size: 10px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await notify(customer, subject, html)
}

export const sendOverdueReminder = async (invoice_id) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (id, full_name, phone, email, account_no)
    `)
    .eq('id', invoice_id)
    .single()

  if (error || !invoice) throw new Error('Invoice not found')

  const { customers: customer } = invoice

  // Calculate payment totals for this invoice
  const { totalPaid, payments } = await calculateInvoicePaymentTotals(invoice_id)
  const totalAmount = Number(invoice.total_amount)
  const remainingBalance = totalAmount - totalPaid
  const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0 && invoice.status !== 'paid'
  const percentPaid = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const subject = `⚠️ URGENT: PureTap — Overdue Invoice ${invoice.invoice_no}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D32F2F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0e0e0; }
        .overdue-box { background: #FEF2F2; border-left: 4px solid #D32F2F; padding: 15px; margin: 15px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
        .total { font-size: 18px; font-weight: bold; color: #D32F2F; }
        .footer { margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .badge-overdue { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #FEF2F2; color: #D32F2F; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ URGENT: Overdue Invoice</h2>
          <p>${invoice.invoice_no}</p>
        </div>
        <div class="content">
          <p>Hi <strong>${customer.full_name}</strong>,</p>
          
          <div class="overdue-box">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #D32F2F;">
              Your water bill is <strong>OVERDUE</strong>
            </p>
          </div>

          <div class="invoice-details">
            <table>
              <tr>
                <th>Invoice No</th>
                <td><strong>${invoice.invoice_no}</strong></td>
              </tr>
              <tr>
                <th>Account No</th>
                <td>${customer.account_no}</td>
              </tr>
              <tr>
                <th>Original Due Date</th>
                <td style="color: #D32F2F; font-weight: bold;">${invoice.due_date}</td>
              </tr>
              <tr>
                <th>Units Consumed</th>
                <td>${invoice.units_consumed} m³</td>
              </tr>
            </table>
          </div>

          <div class="invoice-details">
            <table>
              <tr>
                <th>Amount Due</th>
                <th class="amount">KES ${totalAmount.toLocaleString()}</th>
              </tr>
              ${totalPaid > 0 ? `
                <tr>
                  <td>Amount Paid</td>
                  <td class="amount">- KES ${totalPaid.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Remaining Balance</strong></td>
                  <td class="amount total"><strong>KES ${remainingBalance.toLocaleString()}</strong></td>
                </tr>
                ${isPartiallyPaid ? `
                  <tr>
                    <td>Payment Progress</td>
                    <td class="amount">${percentPaid}% Paid</td>
                  </tr>
                ` : ''}
              ` : `
                <tr>
                  <td><strong>Total Outstanding</strong></td>
                  <td class="amount total"><strong>KES ${totalAmount.toLocaleString()}</strong></td>
                </tr>
              `}
            </table>
          </div>

          <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #D32F2F;">⚠️ Immediate Action Required</h4>
            <p style="margin: 5px 0;">Your water bill is now overdue. Please make the payment immediately to avoid:</p>
            <ul style="margin: 10px 0;">
              <li>Late payment penalties</li>
              <li>Service interruption</li>
              <li>Collection actions</li>
            </ul>
          </div>

          <div class="badge-overdue" style="margin: 10px 0;">
            OVERDUE — PAY NOW
          </div>

          <div style="background: #E6F1FB; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1E4A6B;">Payment Instructions</h4>
            <p style="margin: 5px 0;">Pay via M-Pesa Paybill or through the PureTap customer portal.</p>
            <p style="margin: 5px 0;">Quote your account number <strong>${customer.account_no}</strong> as the reference when paying.</p>
          </div>

          <div class="footer">
            <p style="color: #D32F2F; font-weight: bold;">Please pay immediately to avoid service interruption.</p>
            <p>Thank you,<br/>PureTap Water</p>
            <p style="font-size: 10px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await notify(customer, subject, html)
}

// Keep flagged reading alert for admins (email only)
export const sendFlaggedReadingAlert = async (reading_id) => {
  const { data: reading, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (serial_no, installation_address,
        customers (id, full_name, account_no, phone, email)
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

  const subject = `⚠️ PureTap — Flagged Reading Alert`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ED6C02; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Flagged Reading Alert</h2>
          <p>Review Required</p>
        </div>
        <div class="content">
          <p>A reading has been flagged and requires your review.</p>
          
          <table>
            <tr><th>Reading ID</th><td>${reading.id}</td></tr>
            <tr><th>Meter Serial No</th><td>${reading.meters.serial_no}</td></tr>
            <tr><th>Customer Name</th><td>${reading.meters.customers.full_name}</td></tr>
            <tr><th>Account No</th><td>${reading.meters.customers.account_no}</td></tr>
            <tr><th>Phone</th><td>${reading.meters.customers.phone}</td></tr>
            <tr><th>Installation Address</th><td>${reading.meters.installation_address || 'N/A'}</td></tr>
            <tr><th>Reading Status</th><td><strong style="color: #ED6C02;">${reading.status}</strong></td></tr>
            <tr><th>Manual Value</th><td><strong>${reading.manual_value} m³</strong></td></tr>
            <tr><th>OCR Value</th><td>${reading.ocr_value || 'N/A'} m³</td></tr>
            <tr><th>Previous Reading</th><td>${reading.previous_reading} m³</td></tr>
            <tr><th>Current Reading</th><td>${reading.current_reading} m³</td></tr>
            <tr><th>Units Consumed</th><td>${reading.units_consumed} m³</td></tr>
            <tr><th>Reading Date</th><td>${reading.reading_date}</td></tr>
          </table>

          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #ED6C02;">
              <strong>Please log in to the admin portal to review this reading.</strong>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
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

// Keep the helper function for backward compatibility (though telegram is ignored)
export const saveTelegramChatId = async (chat_id, phone) => {
  // Just return null since we're ignoring telegram
  return null
}