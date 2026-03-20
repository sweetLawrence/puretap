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




// router.get('/:id/download', verifyToken, async (req, res) => {
//   try {
//     const invoice = await billingService.getById(req.params.id)
//     if (!invoice) return sendError(res, 'Invoice not found', 404)

//     const doc = new PDFDocument({ margin: 50 })
//     res.setHeader('Content-Type', 'application/pdf')
//     res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_no}.pdf`)
//     doc.pipe(res)

//     doc.fontSize(20).text('PureTap Water Billing', { align: 'center' })
//     doc.fontSize(12).text('Gitaru Town Water Services', { align: 'center' })
//     doc.moveDown()
//     doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
//     doc.moveDown()

//     doc.fontSize(14).text(`Invoice: ${invoice.invoice_no}`)
//     doc.fontSize(11).text(`Customer: ${invoice.customers?.full_name}`)
//     doc.text(`Account No: ${invoice.customers?.account_no}`)
//     doc.text(`Billing Period: ${invoice.billing_period_start} — ${invoice.billing_period_end}`)
//     doc.text(`Due Date: ${invoice.due_date}`)
//     doc.moveDown()

//     doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
//     doc.moveDown()

//     doc.fontSize(12).text(`Units Consumed: ${invoice.units_consumed} m³`)
//     doc.text(`Amount Due: KES ${Number(invoice.amount_due).toLocaleString()}`)
//     doc.text(`Tax: KES ${Number(invoice.tax_amount).toLocaleString()}`)
//     doc.fontSize(14).text(`Total: KES ${Number(invoice.total_amount).toLocaleString()}`, { underline: true })
//     doc.moveDown()

//     doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
//     doc.moveDown()
//     doc.fontSize(10).text(`Status: ${invoice.status.toUpperCase()}`)
//     doc.text('Thank you for using PureTap Water Services.')

//     doc.end()
//   } catch (err) {
//     sendError(res, err.message, 400)
//   }
// })


router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const invoice = await billingService.getById(req.params.id)
    if (!invoice) return sendError(res, 'Invoice not found', 404)

    const doc = new PDFDocument({ margin: 0, size: 'A4' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_no}.pdf`)
    doc.pipe(res)

    const W = 595
    const H = 842
    const blue = '#185FA5'
    const lightBlue = '#E6F1FB'
    const teal = '#0F6E56'
    const lightGray = '#F4F6FA'
    const darkText = '#1a1a2e'
    const mutedText = '#6B7280'

    // ── Header band ──
    doc.rect(0, 0, W, 110).fill(blue)

    // Logo circle
    doc.circle(60, 55, 24).fill('white')
    doc.circle(60, 55, 18).fill(blue)
    // water drop shape
    doc.save()
    doc.translate(60, 55)
    doc.path('M0,-12 C6,-4 12,2 12,8 A12,12,0,0,1,-12,8 C-12,2 -6,-4 0,-12 Z')
      .fill('white')
    doc.restore()

    // Company name
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
      .text('PureTap', 95, 30)
    doc.fontSize(9).font('Helvetica')
      .text('Water Billing System', 95, 54)
      .text('Gitaru Town, Kenya', 95, 67)

    // INVOICE label on right
    doc.fontSize(28).font('Helvetica-Bold')
      .text('INVOICE', W - 180, 28, { width: 150, align: 'right' })
    doc.fontSize(9).font('Helvetica')
      .text(invoice.invoice_no, W - 180, 65, { width: 150, align: 'right' })

    // ── Invoice meta band ──
    doc.rect(0, 110, W, 70).fill(lightGray)

    const metaY = 125
    const cols = [40, 190, 340, 460]

    doc.fillColor(mutedText).fontSize(8).font('Helvetica')
    doc.text('BILL TO', cols[0], metaY)
    doc.text('ACCOUNT NO', cols[1], metaY)
    doc.text('BILLING PERIOD', cols[2], metaY)
    doc.text('DUE DATE', cols[3], metaY)

    doc.fillColor(darkText).fontSize(10).font('Helvetica-Bold')
    doc.text(invoice.customers?.full_name || '—', cols[0], metaY + 14, { width: 140 })
    doc.text(invoice.customers?.account_no || '—', cols[1], metaY + 14)
    doc.text(
      `${invoice.billing_period_start}\n${invoice.billing_period_end}`,
      cols[2], metaY + 14, { width: 110 }
    )
    doc.text(invoice.due_date || '—', cols[3], metaY + 14)

    // ── Table header ──
    const tableTop = 205
    doc.rect(0, tableTop, W, 28).fill(blue)

    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
    doc.text('DESCRIPTION', 40, tableTop + 9)
    doc.text('UNITS (m³)', 260, tableTop + 9, { width: 100, align: 'center' })
    doc.text('RATE', 370, tableTop + 9, { width: 80, align: 'center' })
    doc.text('AMOUNT (KES)', 450, tableTop + 9, { width: 105, align: 'right' })

    // ── Table row ──
    const rowY = tableTop + 28
    doc.rect(0, rowY, W, 36).fill('white')
    doc.rect(0, rowY, W, 36).stroke('#E5E7EB')

    doc.fillColor(darkText).fontSize(10).font('Helvetica')
    doc.text('Water consumption charge', 40, rowY + 12)
    doc.text(String(invoice.units_consumed), 260, rowY + 12, { width: 100, align: 'center' })

    const rate = invoice.units_consumed > 0
      ? (Number(invoice.amount_due) / Number(invoice.units_consumed)).toFixed(2)
      : '—'
    doc.text(`KES ${rate}`, 370, rowY + 12, { width: 80, align: 'center' })
    doc.text(
      `KES ${Number(invoice.amount_due).toLocaleString()}`,
      450, rowY + 12, { width: 105, align: 'right' }
    )

    // ── Totals section ──
    const totalsX = 360
    const totalsY = rowY + 60
    const totalsW = 195

    // Subtotal row
    doc.rect(totalsX, totalsY, totalsW, 26).fill(lightGray)
    doc.fillColor(mutedText).fontSize(9).font('Helvetica')
      .text('Subtotal', totalsX + 12, totalsY + 8)
    doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold')
      .text(
        `KES ${Number(invoice.amount_due).toLocaleString()}`,
        totalsX, totalsY + 8, { width: totalsW - 12, align: 'right' }
      )

    // Tax row
    doc.rect(totalsX, totalsY + 26, totalsW, 26).fill('white')
    doc.rect(totalsX, totalsY + 26, totalsW, 26).stroke('#E5E7EB')
    doc.fillColor(mutedText).fontSize(9).font('Helvetica')
      .text('Tax', totalsX + 12, totalsY + 34)
    doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold')
      .text(
        `KES ${Number(invoice.tax_amount).toLocaleString()}`,
        totalsX, totalsY + 34, { width: totalsW - 12, align: 'right' }
      )

    // Total row
    doc.rect(totalsX, totalsY + 52, totalsW, 34).fill(blue)
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL DUE', totalsX + 12, totalsY + 62)
    doc.text(
      `KES ${Number(invoice.total_amount).toLocaleString()}`,
      totalsX, totalsY + 62, { width: totalsW - 12, align: 'right' }
    )

    // ── Status badge ──
    const statusColors = {
      paid: '#0F6E56', unpaid: '#B45309',
      overdue: '#991B1B', cancelled: '#6B7280'
    }
    const statusBg = statusColors[invoice.status] || '#6B7280'
    doc.roundedRect(40, totalsY + 8, 80, 22, 4).fill(statusBg)
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text(invoice.status.toUpperCase(), 40, totalsY + 15, { width: 80, align: 'center' })

    // ── Payment instructions ──
    const noteY = totalsY + 120
    doc.rect(40, noteY, W - 80, 70).fill(lightBlue)
    doc.roundedRect(40, noteY, W - 80, 70, 6).stroke(blue)

    doc.fillColor(blue).fontSize(10).font('Helvetica-Bold')
      .text('Payment Instructions', 56, noteY + 12)
    doc.fillColor(darkText).fontSize(9).font('Helvetica')
      .text('Pay via M-Pesa Paybill or through the PureTap customer portal.', 56, noteY + 28)
      .text('Quote your account number as the reference when paying.', 56, noteY + 42)
      .text(`Account Reference: ${invoice.customers?.account_no}`, 56, noteY + 56)

    // ── Footer ──
    doc.rect(0, H - 50, W, 50).fill(darkText)
    doc.fillColor('white').fontSize(8).font('Helvetica')
      .text('PureTap Water Billing System  ·  Gitaru Town, Kenya', 0, H - 32, { align: 'center' })
      .text('For support contact your water supplier', 0, H - 20, { align: 'center' })

    // ── Vertical accent bar ──
    doc.rect(0, 110, 4, H - 160).fill(teal)

    doc.end()
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router