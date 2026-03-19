import app from './src/app.js'
import dotenv from 'dotenv'
import { startAllJobs } from './src/config/cron.js'
dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`PureTap API running on port ${PORT}`)
//   startAllJobs()
})