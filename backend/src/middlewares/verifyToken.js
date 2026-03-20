// import jwt from 'jsonwebtoken'
// import { sendError } from '../utils/responseHelper.js'

// export const verifyToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1]
//   if (!token) return sendError(res, 'No token provided', 401)

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET)
//     req.user = decoded
//     next()
//   } catch {
//     return sendError(res, 'Invalid or expired token', 401)
//   }
// }




// export const verifyToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1]
//   if (!token) return sendError(res, 'No token provided', 401)

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET)
//     req.user = decoded  // has customerId for customers, userId for staff
//     next()
//   } catch {
//     return sendError(res, 'Invalid or expired token', 401)
//   }
// }



















import jwt from 'jsonwebtoken'
import { sendError } from '../utils/responseHelper.js'

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return sendError(res, 'No token provided', 401)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    // normalize — both staff and customer tokens work
    req.user.userId = decoded.userId || decoded.customerId || null
    next()
  } catch {
    return sendError(res, 'Invalid or expired token', 401)
  }
}