import transporter from '../config/mailer.js'

export const sendEmail = async (to, subject, html) => {
  if (!to) throw new Error('No email address provided')

  console.log('Sending email to:', to)
  console.log('Subject:', subject)

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html
  })

  console.log('Email sent:', info.messageId)
  console.log('Response:', info.response)
  return info
}