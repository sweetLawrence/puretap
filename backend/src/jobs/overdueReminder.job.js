import cron from 'node-cron'
import supabase from '../config/supabase.js'
import { sendOverdueReminder } from '../services/notifications.service.js'

export const startOverdueReminderJob = () => {
  // runs every day at 8am
  cron.schedule('0 8 * * *', async () => {
    // cron.schedule('* * * * *', async () => {

    console.log('Running overdue reminder job...')

    const today = new Date().toISOString().split('T')[0]

    // find all unpaid invoices past due date
    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .select('id')
      .in('status', ['unpaid', 'overdue'])
      .lt('due_date', today)

    if (error) {
      console.error('Overdue reminder job error:', error.message)
      return
    }

    if (!overdueInvoices.length) {
      console.log('No overdue invoices found')
      return
    }

    console.log(`Found ${overdueInvoices.length} overdue invoices`)

    for (const invoice of overdueInvoices) {
      try {
        // mark as overdue
        await supabase
          .from('invoices')
          .update({ status: 'overdue', updated_at: new Date() })
          .eq('id', invoice.id)

        // send reminder notification
        await sendOverdueReminder(invoice.id)
        console.log(`Reminder sent for invoice ${invoice.id}`)
      } catch (err) {
        console.error(`Failed for invoice ${invoice.id}:`, err.message)
      }
    }

    console.log('Overdue reminder job complete')
  })
}