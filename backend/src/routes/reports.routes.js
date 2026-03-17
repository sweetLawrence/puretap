import express from 'express'
import * as reportsService from '../services/reports.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)
router.use(requireRole('admin'))

// dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const report = await reportsService.getSummaryReport()
    sendSuccess(res, report)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// revenue report — requires from and to query params
router.get('/revenue', async (req, res) => {
  try {
    const { from, to } = req.query
    if (!from || !to) return sendError(res, 'from and to date params are required', 400)
    const report = await reportsService.getRevenueReport(from, to)
    sendSuccess(res, report)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// consumption report
router.get('/consumption', async (req, res) => {
  try {
    const { from, to } = req.query
    if (!from || !to) return sendError(res, 'from and to date params are required', 400)
    const report = await reportsService.getConsumptionReport(from, to)
    sendSuccess(res, report)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// defaulters report
router.get('/defaulters', async (req, res) => {
  try {
    const report = await reportsService.getDefaultersReport()
    sendSuccess(res, report)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// flagged readings report
router.get('/flagged', async (req, res) => {
  try {
    const report = await reportsService.getFlaggedReadingsReport()
    sendSuccess(res, report)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router