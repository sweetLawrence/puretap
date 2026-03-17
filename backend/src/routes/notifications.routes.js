import express from 'express'
import * as notificationsService from '../services/notifications.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

// telegram webhook — public, called by telegram servers
// router.post('/telegram/webhook', async (req, res) => {
//   try {
//     const message = req.body.message
//     if (!message) return res.sendStatus(200)

//     const chat_id = message.chat.id
//     const text = message.text || ''

//     if (text.startsWith('/start')) {
//       // extract phone if sent as /start +254701234566
//       const parts = text.split(' ')
//       const phone = parts[1] || null

//       if (phone) {
//         const customer = await notificationsService.saveTelegramChatId(chat_id, phone)
//         const { sendMessage } = await import('../services/sms.service.js')

//         if (customer) {
//           await sendMessage(chat_id,
//             `Hi ${customer.full_name}! You are now connected to PureTap Water billing notifications. You will receive your bills and payment confirmations here.`
//           )
//         } else {
//           await sendMessage(chat_id,
//             `We could not find an account linked to ${phone}. Please contact PureTap support.`
//           )
//         }
//       } else {
//         const { sendMessage } = await import('../services/sms.service.js')
//         await sendMessage(chat_id,
//           `Welcome to PureTap Water!\n\nTo link your account, send:\n/start <your phone number>\n\nExample: /start +254701234566`
//         )
//       }
//     }

//     res.sendStatus(200)
//   } catch (err) {
//     console.error('Telegram webhook error:', err.message)
//     res.sendStatus(200)
//   }
// })
router.post('/telegram/webhook', async (req, res) => {
  console.log('WEBHOOK HIT')
  console.log(JSON.stringify(req.body, null, 2))

  try {
    const message = req.body.message
    if (!message) {
      console.log('No message in body')
      return res.sendStatus(200)
    }

    const chat_id = message.chat.id
    const text = message.text || ''
    console.log('chat_id:', chat_id)
    console.log('text:', text)

    if (text.startsWith('/start')) {
      const parts = text.split(' ')
      const phone = parts[1] || null
      console.log('phone extracted:', phone)

      if (phone) {
        console.log('Looking up customer...')
        const customer = await notificationsService.saveTelegramChatId(chat_id, phone)
        console.log('Customer found:', customer)

        const { sendMessage } = await import('../services/sms.service.js')

        if (customer) {
          console.log('Sending welcome message...')
          await sendMessage(chat_id,
            `Hi ${customer.full_name}! You are now connected to PureTap Water billing notifications.`
          )
          console.log('Welcome message sent')
        } else {
          console.log('Customer not found for phone:', phone)
          await sendMessage(chat_id,
            `We could not find an account linked to ${phone}. Please contact PureTap support.`
          )
        }
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Telegram webhook error:', err.message)
    res.sendStatus(200)
  }
})

router.use(verifyToken)

// send invoice notification manually
router.post('/invoice/:invoiceId', requireRole('admin'), async (req, res) => {
  try {
    const result = await notificationsService.sendInvoiceNotification(req.params.invoiceId)
    sendSuccess(res, result, 200, 'Invoice notification sent')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// send payment confirmation manually
router.post('/payment/:paymentId', requireRole('admin'), async (req, res) => {
  try {
    const result = await notificationsService.sendPaymentConfirmation(req.params.paymentId)
    sendSuccess(res, result, 200, 'Payment confirmation sent')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// send overdue reminder manually
router.post('/overdue/:invoiceId', requireRole('admin'), async (req, res) => {
  try {
    const result = await notificationsService.sendOverdueReminder(req.params.invoiceId)
    sendSuccess(res, result, 200, 'Overdue reminder sent')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// alert admins about flagged reading
router.post('/flagged/:readingId', requireRole('admin'), async (req, res) => {
  try {
    const result = await notificationsService.sendFlaggedReadingAlert(req.params.readingId)
    sendSuccess(res, result, 200, 'Flagged reading alert sent to admins')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router