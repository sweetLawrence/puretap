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


// Get invoices by customer with calculated balances
router.get('/customer/:customerId', verifyToken, async (req, res) => {//EXPERIMENTAL 2
  try {
    // Get all invoices for customer
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', req.params.customerId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    // Get all payments for these invoices and calculate balances
    const invoiceIds = invoices.map(i => i.id)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('invoice_id, amount')
      .eq('status', 'completed')
      .in('invoice_id', invoiceIds)

    // Calculate balance for each invoice
    const invoicesWithBalance = invoices.map(invoice => {
      const paymentsForInvoice = allPayments?.filter(p => p.invoice_id === invoice.id) || []
      const totalPaid = paymentsForInvoice.reduce((sum, p) => sum + Number(p.amount), 0)
      const invoiceTotal = Number(invoice.total_amount)
      const remainingBalance = invoiceTotal - totalPaid

      return {
        ...invoice,
        amount_paid: totalPaid,
        remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
        is_fully_paid: remainingBalance <= 0
      }
    })

    sendSuccess(res, invoicesWithBalance)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})


router.get('/:id/balance', verifyToken, async (req, res) => {//EXPERIMENTAL
  try {
    const invoice = await billingService.getInvoiceWithBalance(req.params.id)
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

    const invoiceIds = invoices.map(i => i.id)

    // CHANGED: Get ALL payments with 'successful' status (not 'completed')
    const { data: allPayments } = await supabase
      .from('payments')
      .select('invoice_id, amount, method, status, payment_date')
      .eq('status', 'successful')  // Changed from 'completed' to 'successful'
      .in('invoice_id', invoiceIds)

    // Process invoices with payment calculations (same logic as frontend)
    const invoicesWithPayments = invoices.map(inv => {
      const paymentsForInvoice = allPayments?.filter(p => p.invoice_id === inv.id) || []
      const totalPaid = paymentsForInvoice.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalAmount = Number(inv.total_amount)
      const remainingBalance = totalAmount - totalPaid
      
      // Calculate percent paid
      const percentPaid = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

      const isPartial = totalPaid > 0 && remainingBalance > 0 && inv.status !== 'paid'

      return {
        ...inv,
        amount_paid: totalPaid,
        remaining_balance: remainingBalance > 0 ? remainingBalance : 0,
        is_partial: isPartial,
        percent_paid: Math.round(percentPaid)
      }
    })

    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      bufferPages: true
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=PureTap_Report_${new Date().toISOString().split('T')[0]}.pdf`
    )

    doc.pipe(res)

    // ─────────────────────────────
    // LAYOUT SETTINGS
    // ─────────────────────────────
    const W = 595
    const LEFT = 30
    const CONTENT = 535

    const primary = '#1E4A6B'
    const secondary = '#2C7DA0'
    const success = '#2E7D32'
    const warning = '#ED6C02'
    const danger = '#D32F2F'
    const muted = '#64748B'
    const light = '#F8FAFC'
    const white = '#FFFFFF'

    // ─────────────────────────────
    // HEADER
    // ─────────────────────────────
    doc.rect(0, 0, W, 100).fill(primary)  // Increased height slightly

    // Logo circle
    doc.circle(50, 50, 18).fill('white')
    doc.circle(50, 50, 13).fill(primary)
    doc.save()
    doc.translate(50, 50)
    doc.path('M0,-8 C4,-3 8,1 8,5 A8,8,0,0,1,-8,5 C-8,1 -4,-3 0,-8 Z')
      .fill('white')
    doc.restore()

    doc.fillColor(white)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('PureTap', 80, 35)

    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#CBD5E1')
      .text('Water Billing System', 80, 60)
      .text('Invoice Report', 80, 72)

    // Date range on right
    doc.fillColor(white)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Generated: ${new Date().toLocaleDateString('en-KE')}`,
        W - 130,
        35,
        { width: 100, align: 'right' }
      )
      .text(
        `Range: ${from || 'All'} — ${to || 'Now'}`,
        W - 130,
        50,
        { width: 100, align: 'right' }
      )
      .text(
        `Status: ${status || 'All'}`,
        W - 130,
        65,
        { width: 100, align: 'right' }
      )

    // Summary stats
    const totalInvoices = invoicesWithPayments.length
    const totalOutstanding = invoicesWithPayments.reduce((sum, inv) => {
      if (inv.is_partial) return sum + inv.remaining_balance
      if (inv.status !== 'paid') return sum + Number(inv.total_amount)
      return sum
    }, 0)
    const totalCollected = invoicesWithPayments.reduce((sum, inv) => sum + inv.amount_paid, 0)
    const partialCount = invoicesWithPayments.filter(inv => inv.is_partial).length

    let statsY = 115
    doc.fillColor('#1E293B').fontSize(8).font('Helvetica')
    
    doc.text(`Total Invoices: ${totalInvoices}`, LEFT, statsY)
    doc.text(`Total Collected: KES ${totalCollected.toLocaleString()}`, LEFT + 120, statsY)
    doc.text(`Outstanding: KES ${totalOutstanding.toLocaleString()}`, LEFT + 260, statsY)
    doc.text(`Partial Payments: ${partialCount}`, LEFT + 400, statsY)

    // ─────────────────────────────
    // TABLE HEADER
    // ─────────────────────────────
    const tableTop = 140
    let y = tableTop

    // Adjusted column widths for better spacing
    const cols = {
      sno: 25,
      invoice: 100,
      customer: 160,
      amount: 80,
      paid: 80,
      status: 70
    }

    // Header background
    doc.rect(LEFT, y, CONTENT, 24).fill(secondary)

    doc.fillColor(white).fontSize(8).font('Helvetica-Bold')
    doc.text('#', LEFT + 8, y + 8)
    doc.text('Invoice No.', LEFT + cols.sno, y + 8)
    doc.text('Customer', LEFT + cols.sno + cols.invoice, y + 8)
    doc.text('Total (KES)', LEFT + cols.sno + cols.invoice + cols.customer, y + 8)
    doc.text('Paid (KES)', LEFT + cols.sno + cols.invoice + cols.customer + cols.amount, y + 8)
    doc.text('Status', LEFT + cols.sno + cols.invoice + cols.customer + cols.amount + cols.paid, y + 8)

    y += 24

    // ─────────────────────────────
    // ROWS
    // ─────────────────────────────
    let rowIndex = 0

    for (const inv of invoicesWithPayments) {
      // Check for page break
      if (y > 750) {
        doc.addPage()
        y = 40

        // Repeat header on new page
        doc.rect(LEFT, y, CONTENT, 24).fill(secondary)
        doc.fillColor(white).fontSize(8).font('Helvetica-Bold')
        doc.text('#', LEFT + 8, y + 8)
        doc.text('Invoice No.', LEFT + cols.sno, y + 8)
        doc.text('Customer', LEFT + cols.sno + cols.invoice, y + 8)
        doc.text('Total (KES)', LEFT + cols.sno + cols.invoice + cols.customer, y + 8)
        doc.text('Paid (KES)', LEFT + cols.sno + cols.invoice + cols.customer + cols.amount, y + 8)
        doc.text('Status', LEFT + cols.sno + cols.invoice + cols.customer + cols.amount + cols.paid, y + 8)
        y += 24
      }

      rowIndex++
      const bg = rowIndex % 2 === 0 ? light : white

      doc.rect(LEFT, y, CONTENT, 28).fill(bg)

      // Serial number
      doc.fillColor('#1E293B')
        .font('Helvetica')
        .fontSize(8)
        .text(String(rowIndex), LEFT + 8, y + 10)

      // Invoice number
      doc.font('Helvetica-Bold')
        .text(inv.invoice_no, LEFT + cols.sno, y + 10, { width: cols.invoice - 10 })

      // Customer name (truncate if too long)
      let name = inv.customers?.full_name || '—'
      if (name.length > 25) name = name.slice(0, 22) + '...'
      doc.font('Helvetica')
        .fillColor(muted)
        .text(name, LEFT + cols.sno + cols.invoice, y + 10, { width: cols.customer - 10 })

      // Total amount
      doc.fillColor('#1E293B')
        .font('Helvetica-Bold')
        .text(
          `${Number(inv.total_amount).toLocaleString()}`,
          LEFT + cols.sno + cols.invoice + cols.customer,
          y + 10,
          { width: cols.amount - 5, align: 'right' }
        )

      // Paid amount (show with color)
      const paidAmount = inv.amount_paid
      doc.fillColor(paidAmount > 0 ? success : '#94A3B8')
        .text(
          paidAmount > 0 ? `${paidAmount.toLocaleString()}` : '—',
          LEFT + cols.sno + cols.invoice + cols.customer + cols.amount,
          y + 10,
          { width: cols.paid - 5, align: 'right' }
        )

      // Status (text only, no background - as requested)
      let statusText = inv.status?.toUpperCase() || 'UNKNOWN'
      let statusColor = muted

      if (inv.is_partial) {
        statusText = `PARTIAL (${inv.percent_paid}%)`
        statusColor = warning
      } else if (inv.status === 'paid') {
        statusText = 'PAID'
        statusColor = success
      } else if (inv.status === 'unpaid') {
        statusText = 'UNPAID'
        statusColor = danger
      } else if (inv.status === 'overdue') {
        statusText = 'OVERDUE'
        statusColor = danger
      }

      // Removed background rect, just text with color
      doc.fillColor(statusColor)
        .font('Helvetica-Bold')
        .text(
          statusText,
          LEFT + cols.sno + cols.invoice + cols.customer + cols.amount + cols.paid,
          y + 10,
          { width: cols.status - 5, align: 'center' }
        )

      y += 28
    }

    // ─────────────────────────────
    // FOOTER (with proper spacing)
    // ─────────────────────────────
    const range = doc.bufferedPageRange()

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i)

      // Footer line
      doc.strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .moveTo(LEFT, 770)
        .lineTo(W - LEFT, 770)
        .stroke()

      doc.fillColor('#94A3B8')
        .fontSize(7)
        .font('Helvetica')
        .text(
          'PureTap Water Billing System | Gitaru Town, Kenya',
          LEFT,
          780,
          { align: 'left' }
        )

      doc.text(
        `Page ${i + 1} of ${range.count}`,
        W - 100,
        780,
        { align: 'right' }
      )
      
      // Add generation timestamp
      doc.text(
        `Generated: ${new Date().toLocaleString('en-KE')}`,
        W - 200,
        780,
        { align: 'center', width: 100 }
      )
    }

    doc.end()
  } catch (err) {
    console.error('PDF Generation Error:', err)
    sendError(res, err.message, 500)
  }
})




router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    // Get invoice with payment info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (id, full_name, phone, account_no, credit_balance)
      `)
      .eq('id', req.params.id)
      .single()

    if (invoiceError || !invoice) {
      return sendError(res, 'Invoice not found', 404)
    }

    // Get ALL successful payments for this invoice (changed from 'completed' to 'successful')
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status, payment_date, mpesa_ref')
      .eq('invoice_id', req.params.id)
      .eq('status', 'successful')  // CHANGED: 'completed' → 'successful'

    // Calculate payment totals using the same logic as frontend
    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const invoiceTotal = Number(invoice.total_amount)
    const remainingBalance = invoiceTotal - totalPaid
    // CHANGED: Added percent_paid calculation
    const percentPaid = invoiceTotal > 0 ? (totalPaid / invoiceTotal) * 100 : 0
    const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0 && invoice.status !== 'paid'

    // Set response headers FIRST before creating PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_no}.pdf`)
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 0, size: 'A4' })
    
    // Handle errors on the doc stream
    doc.on('error', (err) => {
      console.error('PDF generation error:', err)
      if (!res.headersSent) {
        sendError(res, 'Failed to generate PDF', 500)
      }
    })
    
    // Pipe to response
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

    // ── Totals section with payment info ──
    const totalsX = 360
    let totalsY = rowY + 60
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

    totalsY += 26

    // Tax row
    doc.rect(totalsX, totalsY, totalsW, 26).fill('white')
    doc.rect(totalsX, totalsY, totalsW, 26).stroke('#E5E7EB')
    doc.fillColor(mutedText).fontSize(9).font('Helvetica')
      .text('Tax', totalsX + 12, totalsY + 8)
    doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold')
      .text(
        `KES ${Number(invoice.tax_amount).toLocaleString()}`,
        totalsX, totalsY + 8, { width: totalsW - 12, align: 'right' }
      )

    totalsY += 26

    // Total row
    doc.rect(totalsX, totalsY, totalsW, 26).fill(blue)
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL AMOUNT', totalsX + 12, totalsY + 8)
    doc.text(
      `KES ${invoiceTotal.toLocaleString()}`,
      totalsX, totalsY + 8, { width: totalsW - 12, align: 'right' }
    )

    totalsY += 26

    // Payment information section (if any payments made)
    if (totalPaid > 0) {
      // Amount Paid row
      doc.rect(totalsX, totalsY, totalsW, 26).fill('#E8F5E9')
      doc.fillColor('#0F6E56').fontSize(9).font('Helvetica-Bold')
        .text('AMOUNT PAID', totalsX + 12, totalsY + 8)
      doc.fillColor('#0F6E56').fontSize(9).font('Helvetica-Bold')
        .text(
          `- KES ${totalPaid.toLocaleString()}`,
          totalsX, totalsY + 8, { width: totalsW - 12, align: 'right' }
        )

      totalsY += 26

      // Remaining Balance row
      const remainingColor = remainingBalance > 0 ? '#DC2626' : '#0F6E56'
      doc.rect(totalsX, totalsY, totalsW, 26).fill(remainingBalance > 0 ? '#FEF2F2' : '#E8F5E9')
      doc.fillColor(remainingColor).fontSize(10).font('Helvetica-Bold')
        .text(remainingBalance > 0 ? 'REMAINING BALANCE' : 'FULLY PAID', totalsX + 12, totalsY + 8)
      doc.fillColor(remainingColor).fontSize(10).font('Helvetica-Bold')
        .text(
          `KES ${remainingBalance.toLocaleString()}`,
          totalsX, totalsY + 8, { width: totalsW - 12, align: 'right' }
        )

      totalsY += 26

      // ADDED: Show percentage paid for partial payments
      if (isPartiallyPaid && percentPaid > 0) {
        doc.rect(totalsX, totalsY, totalsW, 26).fill('#FEF3C7')
        doc.fillColor('#D97706').fontSize(9).font('Helvetica-Bold')
          .text('PAYMENT PROGRESS', totalsX + 12, totalsY + 8)
        doc.fillColor('#D97706').fontSize(9).font('Helvetica-Bold')
          .text(
            `${Math.round(percentPaid)}% PAID`,
            totalsX, totalsY + 8, { width: totalsW - 12, align: 'right' }
          )
        totalsY += 26
      }
    }

    // ── Status badge (updated to show partial correctly) ──
    let displayStatus = invoice.status
    let statusBg = '#6B7280'
    
    if (isPartiallyPaid) {
      displayStatus = `PARTIAL PAID (${Math.round(percentPaid)}%)`
      statusBg = '#F59E0B'
    } else if (invoice.status === 'paid') {
      displayStatus = 'PAID'
      statusBg = '#0F6E56'
    } else if (invoice.status === 'unpaid') {
      displayStatus = 'UNPAID'
      statusBg = '#B45309'
    } else if (invoice.status === 'overdue') {
      displayStatus = 'OVERDUE'
      statusBg = '#991B1B'
    } else {
      displayStatus = invoice.status?.toUpperCase() || 'UNKNOWN'
    }

    doc.roundedRect(40, totalsY - 80, 120, 22, 4).fill(statusBg)  // Increased width for longer text
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
      .text(displayStatus, 40, totalsY - 73, { width: 120, align: 'center' })

    // ── Payment history section (now shows ALL successful payments) ──
    if (payments && payments.length > 0) {
      const paymentHistoryY = totalsY + 20
      if (paymentHistoryY < 750) {
        doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold')
          .text('Payment History', 40, paymentHistoryY)
        
        let paymentY = paymentHistoryY + 15
        payments.forEach((p, idx) => {
          if (paymentY > 750) {
            doc.addPage()
            paymentY = 40
          }
          doc.fillColor(mutedText).fontSize(8).font('Helvetica')
            .text(`${new Date(p.payment_date).toLocaleDateString()}`, 40, paymentY)
            .text(`KES ${Number(p.amount).toLocaleString()}`, 200, paymentY, { width: 100, align: 'right' })
          paymentY += 15
        })
      }
    }

    // ── Payment instructions ──
    const noteY = Math.min(totalsY + 20, 700)
    doc.rect(40, noteY, W - 80, 70).fill(lightBlue)
    doc.roundedRect(40, noteY, W - 80, 70, 6).stroke(blue)

    doc.fillColor(blue).fontSize(9).font('Helvetica-Bold')
      .text('Payment Instructions', 56, noteY + 12)
    doc.fillColor(darkText).fontSize(8).font('Helvetica')
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

    // End the document properly
    doc.end()
    
  } catch (err) {
    console.error('Invoice download error:', err)
    if (!res.headersSent) {
      sendError(res, 'Failed to generate invoice PDF', 500)
    }
  }
})
export default router