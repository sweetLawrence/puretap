import transporter from '../config/mailer.js'
import sendMail from '../config/mailer.js'

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








// import sendMail from '../config/mailerxx.js'

// export const sendEmail = async (to, subject, html) => {
//   if (!to) throw new Error('No email address provided')

//   console.log('Sending email to:', to)
//   console.log('Subject:', subject)

//   const info = await sendMail({ to, subject, html })

//   console.log('Email sent:', info?.id)
//   return info
// }











// import transporter from '../config/mailer.js'

// /**
//  * Send email (SMTP-based service wrapper)
//  * Keeps compatibility with your existing codebase
//  */
// export const sendEmail = async ({ to, subject, html, text }) => {
//   if (!to) throw new Error('No email address provided')

//   try {
//     console.log('📧 Sending email to:', to)
//     console.log('📨 Subject:', subject)

//     const info = await transporter.sendMail({
//       from: process.env.MAIL_FROM,
//       to,
//       subject,
//       html,
//       text: text || '',
//     })

//     console.log('✅ Email sent:', info.messageId)

//     return {
//       success: true,
//       messageId: info.messageId,
//       response: info.response,
//     }
//   } catch (error) {
//     console.error('❌ Email sending failed:', error.message)

//     return {
//       success: false,
//       error: error.message,
//     }
//   }
// }