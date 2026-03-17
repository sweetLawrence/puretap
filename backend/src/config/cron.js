import { startOverdueReminderJob } from '../jobs/overdueReminder.job.js'
import { startInvoiceGenerationJob } from '../jobs/invoiceGeneration.job.js'
import { startAnomalyDigestJob } from '../jobs/anomalyDigest.job.js'

export const startAllJobs = () => {
  startOverdueReminderJob()
  startInvoiceGenerationJob()
  startAnomalyDigestJob()
  console.log('All cron jobs started')
}