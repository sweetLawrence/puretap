import { sendError } from '../utils/responseHelper.js'

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, 'Access denied', 403)
  }
  next()
}