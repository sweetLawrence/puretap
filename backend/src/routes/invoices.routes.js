import express from 'express'
import PDFDocument from 'pdfkit'
import * as billingService from '../services/billing.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'
import supabase from '../config/supabase.js'

const router = express.Router()

router.use(verifyToken)

// get all invoices
router.get('/', requireRole('admin','field_staff'), async (req, res) => {
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







// router.get('/download/all', verifyToken, requireRole('admin'), async (req, res) => {
//   console.log('Generating PDF report for all invoices...')
//   try {
//     // const { data: invoices, error } = await supabase
//     //   .from('invoices')
//     //   .select('*, customers(full_name, account_no, phone)')
//     //   .order('created_at', { ascending: false })

//     // replace with this
// const { from, to, status } = req.query

// let query = supabase
//   .from('invoices')
//   .select('*, customers(full_name, account_no, phone)')
//   .order('created_at', { ascending: false })

// if (status) query = query.eq('status', status)
// if (from) query = query.gte('due_date', from)
// if (to) query = query.lte('due_date', to)

// const { data: invoices, error } = await query







//     if (error) throw new Error(error.message)

//     // const PDFDocument = (await import('pdfkit')).default
//     const doc = new PDFDocument({ margin: 40, size: 'A4' })

//     res.setHeader('Content-Type', 'application/pdf')
//     res.setHeader('Content-Disposition', `attachment; filename=PureTap_Invoices_${new Date().toISOString().split('T')[0]}.pdf`)
//     doc.pipe(res)

//     const W = 515
//     const blue = '#185FA5'
//     const lightGray = '#F4F6FA'
//     const darkText = '#1a1a2e'
//     const mutedText = '#6B7280'

//     // ── Cover header ──
//     doc.rect(0, 0, 595, 80).fill(blue)
//     doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
//       .text('PureTap Water Billing', 40, 20)
//     doc.fontSize(10).font('Helvetica')
//       // .text('All Invoices Report', 40, 48)
//       // .text(`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`, 40, 62)
//       // replace with this
//   .text([
//     status ? `Status: ${status}` : 'All statuses',
//     from ? `From: ${from}` : null,
//     to ? `To: ${to}` : null
//   ].filter(Boolean).join('  ·  '), 40, 48)
//   .text(`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`, 40, 62)







//     // summary stats
//     const total = invoices.length
//     const paid = invoices.filter(i => i.status === 'paid').length
//     const unpaid = invoices.filter(i => ['unpaid', 'overdue'].includes(i.status)).length
//     const totalAmount = invoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
//     const collected = invoices
//       .filter(i => i.status === 'paid')
//       .reduce((sum, i) => sum + Number(i.total_amount || 0), 0)

//     doc.rect(0, 80, 595, 60).fill(lightGray)
//     const stats = [
//       ['Total Invoices', String(total)],
//       ['Paid', String(paid)],
//       ['Unpaid/Overdue', String(unpaid)],
//       ['Total Billed', `KES ${totalAmount.toLocaleString()}`],
//       ['Collected', `KES ${collected.toLocaleString()}`],
//     ]
//     stats.forEach(([label, value], i) => {
//       const x = 40 + i * 103
//       doc.fillColor(mutedText).fontSize(8).font('Helvetica').text(label, x, 88)
//       doc.fillColor(darkText).fontSize(11).font('Helvetica-Bold').text(value, x, 102)
//     })

//     doc.moveDown(4)

//     // ── Table header ──
//     const tableTop = 155
//     const cols = [40, 120, 240, 320, 390, 460]
//     const headers = ['Invoice No', 'Customer', 'Amount', 'Due Date', 'Status', 'Units']

//     doc.rect(40, tableTop, W, 22).fill(blue)
//     doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
//     headers.forEach((h, i) => doc.text(h, cols[i], tableTop + 7))

//     // ── Table rows ──
//     let y = tableTop + 22
//     const rowHeight = 20

//     invoices.forEach((inv, idx) => {
//       // page break
//       if (y > 750) {
//         doc.addPage()
//         y = 40
//         doc.rect(40, y, W, 22).fill(blue)
//         doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
//         headers.forEach((h, i) => doc.text(h, cols[i], y + 7))
//         y += 22
//       }

//       // alternating row bg
//       doc.rect(40, y, W, rowHeight).fill(idx % 2 === 0 ? 'white' : lightGray)

//       // status color
//       const statusColors = {
//         paid: '#0F6E56', unpaid: '#B45309',
//         overdue: '#991B1B', cancelled: '#6B7280', disputed: '#7C3AED'
//       }
//       const statusColor = statusColors[inv.status] || '#6B7280'

//       doc.fillColor(darkText).fontSize(8).font('Helvetica')
//         .text(inv.invoice_no || '—', cols[0], y + 6, { width: 75 })
//         .text(inv.customers?.full_name || '—', cols[1], y + 6, { width: 115, ellipsis: true })
//         .text(`KES ${Number(inv.total_amount).toLocaleString()}`, cols[2], y + 6, { width: 75 })
//         .text(inv.due_date || '—', cols[3], y + 6, { width: 65 })

//       // status pill
//       doc.roundedRect(cols[4], y + 4, 55, 13, 3).fill(statusColor)
//       doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
//         .text(inv.status.toUpperCase(), cols[4] + 2, y + 7, { width: 51, align: 'center' })

//       doc.fillColor(darkText).fontSize(8).font('Helvetica')
//         .text(`${inv.units_consumed} m³`, cols[5], y + 6, { width: 50 })

//       y += rowHeight
//     })

//     // ── Footer ──
//     doc.rect(0, 800, 595, 42).fill(darkText)
//     doc.fillColor('white').fontSize(8).font('Helvetica')
//       .text('PureTap Water Billing System · Gitaru Town, Kenya', 0, 812, { align: 'center' })
//       .text(`Report generated on ${new Date().toLocaleString()}`, 0, 824, { align: 'center' })

//     doc.end()
//   } catch (err) {
//     sendError(res, err.message, 500)
//   }
// })















router.get('/download/all', verifyToken, requireRole('admin'), async (req, res) => {
  console.log('Generating PDF report for all invoices...')

  try {
    const { from, to, status } = req.query

    let query = supabase
      .from('invoices')
      .select('*, customers(full_name, account_no, phone)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (from) query = query.gte('due_date', from)
    if (to) query = query.lte('due_date', to)

    const { data: invoices, error } = await query

    if (error) throw new Error(error.message)

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=PureTap_Invoices_${new Date().toISOString().split('T')[0]}.pdf`
    )

    doc.pipe(res)

    // ─────────────────────────────────────
    // COLORS
    // ─────────────────────────────────────
    const blue = '#185FA5'
    const darkBlue = '#11497F'
    const softBlue = '#F5F9FF'
    const rowAlt = '#FAFBFD'
    const darkText = '#1A1A2E'
    const mutedText = '#6B7280'
    const white = '#FFFFFF'

    const PAGE_WIDTH = 595
    const CONTENT_WIDTH = 515

    // ─────────────────────────────────────
    // TOP HEADER
    // ─────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 105).fill(blue)

    // subtle top accent
    doc.rect(0, 0, PAGE_WIDTH, 8).fill('#4EA5FF')

    doc
      .fillColor(white)
      .font('Helvetica-Bold')
      .fontSize(25)
      .text('PureTap Water Billing', 40, 28)

    doc
      .fillColor('#D8E9FA')
      .font('Helvetica')
      .fontSize(11)
      .text('Invoices Financial Summary Report', 40, 60)

    const filterText = [
      status ? `Status: ${status}` : 'All statuses',
      from ? `From: ${from}` : null,
      to ? `To: ${to}` : null
    ]
      .filter(Boolean)
      .join('   •   ')

    doc
      .fillColor(white)
      .fontSize(9)
      .text(filterText, 40, 82)

    doc
      .fontSize(9)
      .text(
        new Date().toLocaleDateString('en-KE', {
          dateStyle: 'full'
        }),
        380,
        82,
        {
          width: 170,
          align: 'right'
        }
      )

    // decorative side block
    doc.rect(520, 18, 8, 65).fill('#63B3FF')
    doc.rect(535, 18, 8, 50).fill('#9FD0FF')

    // ─────────────────────────────────────
    // SUMMARY STRIP
    // ─────────────────────────────────────
    const total = invoices.length

    const paid = invoices.filter(i => i.status === 'paid').length

    const unpaid = invoices.filter(i =>
      ['unpaid', 'overdue'].includes(i.status)
    ).length

    const totalAmount = invoices.reduce(
      (sum, i) => sum + Number(i.total_amount || 0),
      0
    )

    const collected = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0)

    const stats = [
      ['TOTAL', total],
      ['PAID', paid],
      ['UNPAID', unpaid],
      ['BILLED', `KES ${totalAmount.toLocaleString()}`],
      ['COLLECTED', `KES ${collected.toLocaleString()}`]
    ]

    let statX = 40
    const statY = 132

    stats.forEach(([label, value], i) => {
      if (i !== 0) {
        doc.rect(statX - 12, statY + 2, 1, 34).fill('#D9E3EF')
      }

      doc
        .fillColor(mutedText)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(label, statX, statY)

      doc
        .fillColor(darkText)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(String(value), statX, statY + 14)

      statX += 103
    })

    // separator line
    doc.rect(40, 182, CONTENT_WIDTH, 2).fill('#E5EDF7')

    // ─────────────────────────────────────
    // TABLE HEADER
    // ─────────────────────────────────────
    const tableTop = 205
    const rowHeight = 30

    const cols = {
      invoice: 48,
      customer: 135,
      amount: 285,
      dueDate: 372,
      status: 450,
      units: 515
    }

    // dark strip
    doc.rect(40, tableTop, CONTENT_WIDTH, 24).fill(darkBlue)

    doc
      .fillColor(white)
      .font('Helvetica-Bold')
      .fontSize(8.5)

    doc.text('Invoice No', cols.invoice, tableTop + 8)
    doc.text('Customer', cols.customer, tableTop + 8)
    doc.text('Amount', cols.amount, tableTop + 8)
    doc.text('Due Date', cols.dueDate, tableTop + 8)
    doc.text('Status', cols.status, tableTop + 8)
    doc.text('Units', cols.units, tableTop + 8)

    // ─────────────────────────────────────
    // TABLE ROWS
    // ─────────────────────────────────────
    let y = tableTop + 24

    invoices.forEach((inv, idx) => {
      // PAGE BREAK
      if (y > 742) {
        doc.addPage()

        y = 40

        doc.rect(40, y, CONTENT_WIDTH, 24).fill(darkBlue)

        doc
          .fillColor(white)
          .font('Helvetica-Bold')
          .fontSize(8.5)

        doc.text('Invoice No', cols.invoice, y + 8)
        doc.text('Customer', cols.customer, y + 8)
        doc.text('Amount', cols.amount, y + 8)
        doc.text('Due Date', cols.dueDate, y + 8)
        doc.text('Status', cols.status, y + 8)
        doc.text('Units', cols.units, y + 8)

        y += 24
      }

      // alternating soft backgrounds
      doc
        .rect(40, y, CONTENT_WIDTH, rowHeight)
        .fill(idx % 2 === 0 ? white : rowAlt)

      // subtle left accent line
      doc
        .rect(40, y, 4, rowHeight)
        .fill(idx % 2 === 0 ? '#D9E9FA' : '#C7DDF5')

      // invoice data
      doc
        .fillColor(darkText)
        .font('Helvetica')
        .fontSize(8.5)

      doc.text(inv.invoice_no || '—', cols.invoice, y + 10, {
        width: 75
      })

      doc.text(inv.customers?.full_name || '—', cols.customer, y + 10, {
        width: 135,
        ellipsis: true
      })

      doc
        .font('Helvetica-Bold')
        .text(
          `KES ${Number(inv.total_amount || 0).toLocaleString()}`,
          cols.amount,
          y + 10
        )

      doc
        .font('Helvetica')
        .fillColor(mutedText)
        .text(inv.due_date || '—', cols.dueDate, y + 10)

      // status
      const statusColors = {
        paid: '#0F9D58',
        unpaid: '#F59E0B',
        overdue: '#DC2626',
        cancelled: '#6B7280',
        disputed: '#7C3AED'
      }

      doc
        .fillColor(statusColors[inv.status] || mutedText)
        .font('Helvetica-Bold')
        .text(
          (inv.status || 'unknown').toUpperCase(),
          cols.status,
          y + 10
        )

      doc
        .fillColor(darkText)
        .font('Helvetica')
        .text(`${inv.units_consumed || 0} m³`, cols.units, y + 10)

      y += rowHeight
    })

    // ─────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────
    const range = doc.bufferedPageRange()

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i)

      // top line above footer
      doc.rect(40, 790, CONTENT_WIDTH, 1).fill('#DCE5EF')

      doc
        .fillColor(mutedText)
        .font('Helvetica')
        .fontSize(8)

      doc.text(
        'PureTap Water Billing System',
        40,
        802
      )

      doc.text(
        `Generated ${new Date().toLocaleString()}`,
        200,
        802
      )

      doc.text(
        `Page ${i + 1} of ${range.count}`,
        470,
        802
      )
    }

    doc.end()
  } catch (err) {
    sendError(res, err.message, 500)
  }
})







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