import express from 'express'
import * as authService from '../services/auth.service.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'
import { requireRole } from '../middlewares/requireRole.js'

const router = express.Router()

// router.post('/register', async (req, res) => {
//   try {
//     const user = await authService.register(req.body)
//     sendSuccess(res, user, 201, 'User registered successfully')
//   } catch (err) {
//     sendError(res, err.message, 400)
//   }
// })


// register — admin only, not public
router.post('/register', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await authService.register(req.body)
    sendSuccess(res, user, 201, 'User created successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})


router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body)
    sendSuccess(res, result, 200, 'Login successful')
  } catch (err) {
    sendError(res, err.message, 401)
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return sendError(res, 'Refresh token required', 400)
    const result = await authService.refresh(refreshToken)
    sendSuccess(res, result, 200, 'Token refreshed')
  } catch (err) {
    sendError(res, err.message, 401)
  }
})

router.post('/logout', verifyToken, async (req, res) => {
  try {
    await authService.logout(req.user.userId)
    sendSuccess(res, null, 200, 'Logged out successfully')
  } catch (err) {
    sendError(res, err.message, 400)
  }
})

export default router