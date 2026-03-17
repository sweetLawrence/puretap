import express from 'express'
import * as auditlogService from '../services/auditlog.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)
router.use(requireRole('admin'))

// get all logs with optional filters
router.get('/', async (req, res) => {
  try {
    const { from, to, user_id, table_name, action } = req.query
    const logs = await auditlogService.getAll({ from, to, user_id, table_name, action })
    sendSuccess(res, logs)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single log
router.get('/:id', async (req, res) => {
  try {
    const entry = await auditlogService.getById(req.params.id)
    sendSuccess(res, entry)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

export default router