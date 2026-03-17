import express from 'express'
import * as readingsService from '../services/readings.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)

// get all readings — admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const readings = await readingsService.getAll()
    sendSuccess(res, readings)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get flagged readings — admin only
router.get('/flagged', requireRole('admin'), async (req, res) => {
  try {
    const readings = await readingsService.getFlagged()
    sendSuccess(res, readings)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get readings by meter
router.get('/meter/:meterId', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const readings = await readingsService.getByMeterId(req.params.meterId)
    sendSuccess(res, readings)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get last reading for a meter — used by frontend to pre-fill previous reading
router.get('/meter/:meterId/last', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const reading = await readingsService.getLastReading(req.params.meterId)
    sendSuccess(res, reading)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single reading
router.get('/:id', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const reading = await readingsService.getById(req.params.id)
    sendSuccess(res, reading)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// submit a reading — field_staff and admin
router.post('/', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const reading = await readingsService.create({
      ...req.body,
      submitted_by: req.user.userId
    })
    sendSuccess(res, reading, 201, 'Reading submitted successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// review a flagged reading — admin only
router.patch('/:id/review', requireRole('admin'), async (req, res) => {
  try {
    const reading = await readingsService.review(
      req.params.id,
      req.body,
      req.user.userId
    )
    sendSuccess(res, reading, 200, 'Reading reviewed successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router