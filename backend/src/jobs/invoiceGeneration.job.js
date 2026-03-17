import cron from 'node-cron'
import supabase from '../config/supabase.js'
import { generateInvoice } from '../services/billing.service.js'
import { sendInvoiceNotification } from '../services/notifications.service.js'

export const startInvoiceGenerationJob = () => {
  // runs on the 1st of every month at 6am
  cron.schedule('0 6 1 * *', async () => {
    // cron.schedule('* * * * *', async () => {

    console.log('Running invoice generation job...')

    // get last month date range
    const now = new Date()
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0]
    const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0]

    // find verified readings from last month with no invoice yet
    const { data: readings, error } = await supabase
      .from('readings')
      .select(`
        id,
        invoices (id)
      `)
      .eq('status', 'verified')
      .gte('reading_date', firstOfLastMonth)
      .lte('reading_date', lastOfLastMonth)

    if (error) {
      console.error('Invoice generation job error:', error.message)
      return
    }

    // filter out readings that already have an invoice
    const unInvoiced = readings.filter(r => !r.invoices || r.invoices.length === 0)

    if (!unInvoiced.length) {
      console.log('No uninvoiced readings found')
      return
    }

    console.log(`Found ${unInvoiced.length} readings to invoice`)

    for (const reading of unInvoiced) {
      try {
        const invoice = await generateInvoice(reading.id)
        console.log(`Invoice ${invoice.invoice_no} generated for reading ${reading.id}`)

        // notify customer
        await sendInvoiceNotification(invoice.id)
        console.log(`Notification sent for invoice ${invoice.id}`)
      } catch (err) {
        console.error(`Failed for reading ${reading.id}:`, err.message)
      }
    }

    console.log('Invoice generation job complete')
  })
}