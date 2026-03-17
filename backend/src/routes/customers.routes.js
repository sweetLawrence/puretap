import express from 'express'
import * as customersService from '../services/customers.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

// all customers routes require login
router.use(verifyToken)

// get all customers — admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const customers = await customersService.getAll()
    sendSuccess(res, customers)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// search customers
router.get('/search', requireRole('admin'), async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return sendError(res, 'Search query required', 400)
    const customers = await customersService.search(q)
    sendSuccess(res, customers)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single customer — admin or field_staff
router.get('/:id', requireRole('admin', 'field_staff'), async (req, res) => {
  try {
    const customer = await customersService.getById(req.params.id)
    sendSuccess(res, customer)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// create customer — admin only
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const customer = await customersService.create(req.body)
    sendSuccess(res, customer, 201, 'Customer created successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// update customer — admin only
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const customer = await customersService.update(req.params.id, req.body)
    sendSuccess(res, customer, 200, 'Customer updated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// deactivate customer — admin only
router.patch('/:id/deactivate', requireRole('admin'), async (req, res) => {
  try {
    const customer = await customersService.deactivate(req.params.id)
    sendSuccess(res, customer, 200, 'Customer deactivated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router