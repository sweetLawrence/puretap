import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

// verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Mailer connection failed:', error.message)
  } else {
    console.log('Mailer ready')
  }
})

export default transporter