import cron from 'node-cron'
import supabase from '../config/supabase.js'
import { sendEmail } from '../services/email.service.js'

export const startAnomalyDigestJob = () => {
  // runs every monday at 7am
  cron.schedule('0 7 * * 1', async () => {
    // cron.schedule('* * * * *', async () => {

    console.log('Running anomaly digest job...')

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const from = sevenDaysAgo.toISOString().split('T')[0]

    const { data: flagged, error } = await supabase
      .from('readings')
      .select(`
        *,
        meters (
          serial_no,
          customers (full_name, account_no)
        )
      `)
      .in('status', ['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'])
      .gte('created_at', from)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Anomaly digest job error:', error.message)
      return
    }

    if (!flagged.length) {
      console.log('No flagged readings this week')
      return
    }

    // get all admin emails
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('is_active', true)

    if (!admins.length) {
      console.log('No admins found')
      return
    }

    const rows = flagged.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.meters?.serial_no}</td>
        <td>${r.meters?.customers?.full_name}</td>
        <td>${r.meters?.customers?.account_no}</td>
        <td>${r.status}</td>
        <td>${r.manual_value}</td>
        <td>${r.ocr_value || 'N/A'}</td>
        <td>${r.reading_date}</td>
      </tr>
    `).join('')

    const html = `
      <h2>PureTap — Weekly Flagged Readings Digest</h2>
      <p>The following readings were flagged in the past 7 days and require review.</p>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Meter</th>
            <th>Customer</th>
            <th>Account No</th>
            <th>Status</th>
            <th>Manual</th>
            <th>OCR</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Please log in to PureTap to review and resolve these readings.</p>
      <p>PureTap Water</p>
    `

    for (const admin of admins) {
      try {
        await sendEmail(admin.email, 'PureTap — Weekly Flagged Readings Digest', html)
        console.log(`Digest sent to ${admin.email}`)
      } catch (err) {
        console.error(`Failed to send digest to ${admin.email}:`, err.message)
      }
    }

    console.log('Anomaly digest job complete')
  })
}