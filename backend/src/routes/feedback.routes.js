import express from 'express'
import * as feedbackService from '../services/feedback.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

// customer — submit feedback
router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, subject, message, rating } = req.body
    const customer_id = req.user.customerId
    if (!customer_id) return sendError(res, 'Only customers can submit feedback', 403)
    if (!type || !subject || !message) return sendError(res, 'type, subject and message are required', 400)
    if (type === 'review' && rating && (rating < 1 || rating > 5)) {
      return sendError(res, 'Rating must be between 1 and 5', 400)
    }
    const data = await feedbackService.create({ customer_id, type, subject, message, rating })
    sendSuccess(res, data, 201, 'Feedback submitted')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// customer — get own feedback
router.get('/my', verifyToken, async (req, res) => {
  try {
    const customer_id = req.user.customerId
    if (!customer_id) return sendError(res, 'Unauthorized', 403)
    const data = await feedbackService.getByCustomer(customer_id)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// admin — get all feedback
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { type, status } = req.query
    const data = await feedbackService.getAll({ type, status })
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// admin — respond to feedback
router.patch('/:id/respond', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, admin_response } = req.body
    if (!admin_response) return sendError(res, 'Response message is required', 400)
    const data = await feedbackService.respond(req.params.id, {
      status: status || 'resolved',
      admin_response,
      responded_by: req.user.userId
    })
    sendSuccess(res, data, 200, 'Response sent')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// admin — update status only
router.patch('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body
    const data = await feedbackService.updateStatus(req.params.id, status)
    sendSuccess(res, data, 200, 'Status updated')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router