import express from 'express'
import * as metersService from '../services/meters.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)

// get all meters — admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const meters = await metersService.getAll()
    sendSuccess(res, meters)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get meters by customer — admin and field_staff
router.get('/customer/:customerId', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const meters = await metersService.getByCustomerId(req.params.customerId)
    sendSuccess(res, meters)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// TODO: /read/serialNo


// get meter by serial number — used when QR code is scanned
router.get('/scan/:serialNo', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const meter = await metersService.getBySerialNo(req.params.serialNo)
    sendSuccess(res, meter)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// get single meter by id
router.get('/:id', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const meter = await metersService.getById(req.params.id)
    sendSuccess(res, meter)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// create meter — admin only
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const meter = await metersService.create(req.body)
    sendSuccess(res, meter, 201, 'Meter created successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// update meter — admin only
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const meter = await metersService.update(req.params.id, req.body)
    sendSuccess(res, meter, 200, 'Meter updated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// deactivate meter — admin only
router.patch('/:id/deactivate', requireRole('admin'), async (req, res) => {
  try {
    const meter = await metersService.deactivate(req.params.id)
    sendSuccess(res, meter, 200, 'Meter deactivated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router