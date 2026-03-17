import express from 'express'
import * as paymentsService from '../services/payments.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

// mpesa callback is public — safaricom calls it directly, no auth
router.post('/mpesa/callback', async (req, res) => {
  try {
    const result = await paymentsService.mpesaCallback(req.body)
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (err) {
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Received' })
  }
})

router.use(verifyToken)

// get all payments
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const payments = await paymentsService.getAll()
    sendSuccess(res, payments)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get payments by customer
router.get('/customer/:customerId', requireRole('admin'), async (req, res) => {
  try {
    const payments = await paymentsService.getByCustomerId(req.params.customerId)
    sendSuccess(res, payments)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single payment
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const payment = await paymentsService.getById(req.params.id)
    sendSuccess(res, payment)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// initiate mpesa stk push
router.post('/mpesa/initiate', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const { invoice_id, phone } = req.body
    if (!invoice_id || !phone) return sendError(res, 'invoice_id and phone are required', 400)
    const result = await paymentsService.initiateStkPush(invoice_id, phone)
    sendSuccess(res, result, 200, 'STK push sent to customer phone')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// record manual payment — cash or bank
router.post('/manual', requireRole('admin'), async (req, res) => {
  try {
    const payment = await paymentsService.recordManual({
      ...req.body,
      received_by: req.user.userId
    })
    sendSuccess(res, payment, 201, 'Payment recorded successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router