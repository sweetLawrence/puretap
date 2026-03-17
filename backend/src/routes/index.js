import express from 'express'
import authRoutes from './auth.routes.js'
import customerRoutes from './customers.routes.js'
import meterRoutes from './meters.routes.js'
import readingRoutes from './readings.routes.js'
import tariffRoutes from './tariffs.routes.js'
import invoiceRoutes from './invoices.routes.js'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/customers', customerRoutes)
router.use('/meters', meterRoutes)
router.use('/readings', readingRoutes)
router.use('/tariffs', tariffRoutes)
router.use('/invoices', invoiceRoutes)

export default router
// ```

// ---

// ### Test in Postman

// **Get active tariffs**
// ```
// GET http://localhost:5000/api/v1/tariffs/active
// ```

// **Generate invoice from a verified reading**
// ```
// POST http://localhost:5000/api/v1/invoices/generate
// Content-Type: application/json

// {
//   "reading_id": 1
// }
// ```

// **Get all invoices**
// ```
// GET http://localhost:5000/api/v1/invoices
// ```

// **Get overdue invoices**
// ```
// GET http://localhost:5000/api/v1/invoices/overdue
// ```

// **Get invoices for a customer**
// ```
// GET http://localhost:5000/api/v1/invoices/customer/1
// ```

// **Manually update invoice status**
// ```
// PATCH http://localhost:5000/api/v1/invoices/1/status
// Content-Type: application/json

// {
//   "status": "overdue"
// }