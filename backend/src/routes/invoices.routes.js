import express from 'express'
import * as billingService from '../services/billing.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)

// get all invoices
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const invoices = await billingService.getAll()
    sendSuccess(res, invoices)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get overdue invoices
router.get('/overdue', requireRole('admin'), async (req, res) => {
  try {
    const invoices = await billingService.getOverdue()
    sendSuccess(res, invoices)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get invoices by customer
router.get('/customer/:customerId', requireRole('admin'), async (req, res) => {
  try {
    const invoices = await billingService.getByCustomerId(req.params.customerId)
    sendSuccess(res, invoices)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single invoice
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const invoice = await billingService.getById(req.params.id)
    sendSuccess(res, invoice)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// generate invoice from a reading
router.post('/generate', requireRole('admin'), async (req, res) => {
  try {
    const { reading_id } = req.body
    if (!reading_id) return sendError(res, 'reading_id is required', 400)
    const invoice = await billingService.generateInvoice(reading_id)
    sendSuccess(res, invoice, 201, 'Invoice generated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// update invoice status manually
router.patch('/:id/status', requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return sendError(res, 'status is required', 400)
    const invoice = await billingService.updateStatus(req.params.id, status)
    sendSuccess(res, invoice, 200, 'Invoice status updated')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router