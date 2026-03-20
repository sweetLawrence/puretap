import express from 'express'
import PDFDocument from 'pdfkit'
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
// router.get('/customer/:customerId', requireRole('admin'), async (req, res) => {
//   try {
//     const invoices = await billingService.getByCustomerId(req.params.customerId)
//     sendSuccess(res, invoices)
//   } catch (err) {
//     sendError(res, err.message, 400)
//   }
// })


// allow customers to see their own invoices
router.get('/customer/:customerId', verifyToken, async (req, res) => {
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




router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const invoice = await billingService.getById(req.params.id)
    if (!invoice) return sendError(res, 'Invoice not found', 404)

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_no}.pdf`)
    doc.pipe(res)

    doc.fontSize(20).text('PureTap Water Billing', { align: 'center' })
    doc.fontSize(12).text('Gitaru Town Water Services', { align: 'center' })
    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()

    doc.fontSize(14).text(`Invoice: ${invoice.invoice_no}`)
    doc.fontSize(11).text(`Customer: ${invoice.customers?.full_name}`)
    doc.text(`Account No: ${invoice.customers?.account_no}`)
    doc.text(`Billing Period: ${invoice.billing_period_start} — ${invoice.billing_period_end}`)
    doc.text(`Due Date: ${invoice.due_date}`)
    doc.moveDown()

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()

    doc.fontSize(12).text(`Units Consumed: ${invoice.units_consumed} m³`)
    doc.text(`Amount Due: KES ${Number(invoice.amount_due).toLocaleString()}`)
    doc.text(`Tax: KES ${Number(invoice.tax_amount).toLocaleString()}`)
    doc.fontSize(14).text(`Total: KES ${Number(invoice.total_amount).toLocaleString()}`, { underline: true })
    doc.moveDown()

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()
    doc.fontSize(10).text(`Status: ${invoice.status.toUpperCase()}`)
    doc.text('Thank you for using PureTap Water Services.')

    doc.end()
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router