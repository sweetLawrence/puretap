import express from 'express'
import authRoutes from './auth.routes.js'
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

// **Get all logs**
// ```
// GET http://localhost:5000/api/v1/audit-logs
// Authorization: Bearer <token>
// ```

// **Filter by table**
// ```
// GET http://localhost:5000/api/v1/audit-logs?table_name=customers
// Authorization: Bearer <token>
// ```

// **Filter by date range**
// ```
// GET http://localhost:5000/api/v1/audit-logs?from=2025-01-01&to=2025-12-31
// Authorization: Bearer <token>
// ```

// **Filter by action**
// ```
// GET http://localhost:5000/api/v1/audit-logs?action=CREATE
// Authorization: Bearer <token>