// import nodemailer from 'nodemailer'
// import dotenv from 'dotenv'
// dotenv.config()

// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,
//   port: process.env.MAIL_PORT,
//   secure: false,
//   // family: 4, // FORCE IPv4
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS
//   }
// })

// // verify connection on startup
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Mailer connection failed:', error.message)
//   } else {
//     console.log('Mailer ready')
//   }
// })

// export default transporter





import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  // family: 4, // FORCE IPv4
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

// Retry configuration
const MAX_RETRIES = 5
const INITIAL_DELAY_MS = 1000 // 1 second

// Verify connection with retry
const verifyConnection = async (retryCount = 0) => {
  try {
    await transporter.verify()
    console.log('Mailer ready')
    return true
  } catch (error) {
    console.error(`Mailer connection attempt ${retryCount + 1}/${MAX_RETRIES} failed:`, error.message)
    
    if (retryCount + 1 < MAX_RETRIES) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount)
      console.log(`Retrying in ${delay / 1000} seconds...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return verifyConnection(retryCount + 1)
    } else {
      console.error(`Mailer: All ${MAX_RETRIES} connection attempts failed`)
      return false
    }
  }
}

// Send email with retry functionality
export const sendEmailWithRetry = async (mailOptions, retryCount = 0) => {
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return { success: true, data: info }
  } catch (error) {
    console.error(`Email send attempt ${retryCount + 1}/${MAX_RETRIES} failed:`, error.message)
    
    if (retryCount + 1 < MAX_RETRIES) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount)
      console.log(`Retrying in ${delay / 1000} seconds...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return sendEmailWithRetry(mailOptions, retryCount + 1)
    } else {
      console.error(`All ${MAX_RETRIES} attempts to send email failed`)
      return { success: false, error: error.message }
    }
  }
}

// Start connection verification
verifyConnection()

export default transporter




