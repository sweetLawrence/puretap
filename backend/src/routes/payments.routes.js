import express from 'express'
import * as paymentsService from '../services/payments.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

// mpesa callback is public — safaricom calls it directly, no auth
router.post('/mpesa/callback', async (req, res) => {
 console.log('🔔 MPESA CALLBACK RECEIVED at:', new Date().toISOString())
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2))
  try {
    const result = await paymentsService.mpesaCallback(req.body)
    console.log('✅ Callback processed successfully:', result)
    console.log('MPESA CALLBACK:', JSON.stringify(req.body, null, 2))
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (err) {
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Received' })
  }
})

router.use(verifyToken)

// get all payments
router.get('/', requireRole('admin','customer'), async (req, res) => {
  try {
    const payments = await paymentsService.getAll()
    sendSuccess(res, payments)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get payments by customer
// router.get('/customer/:customerId', requireRole('admin'), async (req, res) => {
  router.get('/customer/:customerId', verifyToken, async (req, res) => {
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



// Update the route to accept amount parameter
router.post('/mpesa/initiate', verifyToken, requireRole('admin', 'field_staff', 'customer'), async (req, res) => {
  try {
    const { invoice_id, phone, amount } = req.body  // Add amount to destructuring
    if (!invoice_id || !phone) return sendError(res, 'invoice_id and phone are required', 400)
    
    // Pass the amount to the service (can be undefined for full payment)
    const result = await paymentsService.initiateStkPush(invoice_id, String(phone).trim(), amount)
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
































// Add these routes after your existing routes, before export default router

// Get customer credit balance
router.get('/credit/balance/:customerId', verifyToken, async (req, res) => {
  try {
    const balance = await paymentsService.getCustomerCreditBalance(req.params.customerId)
    sendSuccess(res, { credit_balance: balance })
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// Get customer credit transactions
router.get('/credit/transactions/:customerId', verifyToken, async (req, res) => {
  try {
    const transactions = await paymentsService.getCreditTransactions(req.params.customerId)
    sendSuccess(res, transactions)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})
export default router