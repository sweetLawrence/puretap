import express from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './users.routes.js'
import customerRoutes from './customers.routes.js'
import meterRoutes from './meters.routes.js'
import readingRoutes from './readings.routes.js'
import tariffRoutes from './tariffs.routes.js'
import invoiceRoutes from './invoices.routes.js'
import paymentRoutes from './payments.routes.js'
import notificationRoutes from './notifications.routes.js'
import reportRoutes from './reports.routes.js'
import auditlogRoutes from './auditlogs.routes.js'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/customers', customerRoutes)
router.use('/meters', meterRoutes)
router.use('/readings', readingRoutes)
router.use('/tariffs', tariffRoutes)
router.use('/invoices', invoiceRoutes)
router.use('/payments', paymentRoutes)
router.use('/notifications', notificationRoutes)
router.use('/reports', reportRoutes)
router.use('/audit-logs', auditlogRoutes)

export default router
// ```

// ---

// ### Test in Postman

// **Get all users**
// ```
// GET http://localhost:5000/api/v1/users
// Authorization: Bearer <token>
// ```

// **Create a new field staff — admin only**
// ```
// POST http://localhost:5000/api/v1/auth/register
// Authorization: Bearer <token>
// Content-Type: application/json

// {
//   "full_name": "New Field Staff",
//   "phone": "+254700000001",
//   "email": "fieldstaff@puretap.co.ke",
//   "password": "Staff@1234",
//   "role": "field_staff"
// }
// ```

// **Deactivate a user**
// ```
// PATCH http://localhost:5000/api/v1/users/11/deactivate
// Authorization: Bearer <token>