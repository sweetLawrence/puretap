import express from 'express'
import supabase from '../config/supabase.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { requireRole } from '../middlewares/requireRole.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = express.Router()

router.use(verifyToken)
router.use(requireRole('admin'))

// get all users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, phone, email, role, is_active, last_login_at, created_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// get single user
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, phone, email, role, is_active, last_login_at, created_at')
      .eq('id', req.params.id)
      .single()

    if (error) throw new Error('User not found')
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err.message, 404)
  }
})

// update user
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['full_name', 'phone', 'email', 'role', 'is_active']
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    )

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('id, full_name, phone, email, role, is_active')
      .single()

    if (error) throw new Error(error.message)
    sendSuccess(res, data, 200, 'User updated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

// deactivate user
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('id, full_name, role, is_active')
      .single()

    if (error) throw new Error(error.message)
    sendSuccess(res, data, 200, 'User deactivated successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router