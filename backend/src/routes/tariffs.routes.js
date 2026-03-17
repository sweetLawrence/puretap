import express from 'express'
import * as tariffsService from '../services/tariffs.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)

// get all tariffs
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const tariffs = await tariffsService.getAll()
    sendSuccess(res, tariffs)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get active tariffs only
router.get('/active', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const tariffs = await tariffsService.getActive()
    sendSuccess(res, tariffs)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single tariff
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const tariff = await tariffsService.getById(req.params.id)
    sendSuccess(res, tariff)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// create tariff
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const tariff = await tariffsService.create(req.body)
    sendSuccess(res, tariff, 201, 'Tariff created successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// update tariff
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const tariff = await tariffsService.update(req.params.id, req.body)
    sendSuccess(res, tariff, 200, 'Tariff updated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// deactivate tariff
router.patch('/:id/deactivate', requireRole('admin'), async (req, res) => {
  try {
    const tariff = await tariffsService.deactivate(req.params.id)
    sendSuccess(res, tariff, 200, 'Tariff deactivated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router