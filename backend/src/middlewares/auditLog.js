// import { log } from '../services/auditlog.service.js'

// const MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']

// export const auditLog = async (req, res, next) => {
//   if (!MUTATING_METHODS.includes(req.method)) return next()

//   // skip telegram webhook and mpesa callback — external services
//   const skipRoutes = [
//     '/api/v1/notifications/telegram/webhook',
//     '/api/v1/payments/mpesa/callback'
//   ]
//   if (skipRoutes.includes(req.path)) return next()

//   // capture original json method to intercept response
//   const originalJson = res.json.bind(res)

//   res.json = async body => {
//     // only log successful responses
//     if (res.statusCode >= 200 && res.statusCode < 300) {
//       try {
//         await log({
//           user_id: req.user?.userId || null,
//           // with this
//           action: `${req.method}_${(
//             pathParts[2] ||
//             pathParts[1] ||
//             'unknown'
//           ).toUpperCase()}`,
//           table_name: pathParts[2] || pathParts[1] || 'unknown',
//           record_id: body?.data?.id || req.params?.id || null,
//           new_data: req.body || null,
//           ip_address: req.ip || req.headers['x-forwarded-for'] || null
//         })
//       } catch (err) {
//         console.error('Audit middleware error:', err.message)
//       }
//     }
//     return originalJson(body)
//   }

//   next()
// }




import { log } from '../services/auditlog.service.js'

const MUTATING_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']

const ROUTE_TABLE_MAP = {
  'customers': 'customers',
  'meters': 'meters',
  'readings': 'readings',
  'tariffs': 'tariffs',
  'invoices': 'invoices',
  'payments': 'payments',
  'notifications': 'notifications',
  'reports': 'reports',
  'audit-logs': 'audit_logs',
  'auth': 'users'
}

export const auditLog = async (req, res, next) => {
  if (!MUTATING_METHODS.includes(req.method)) return next()

  const skipRoutes = [
    '/api/v1/notifications/telegram/webhook',
    '/api/v1/payments/mpesa/callback'
  ]
  if (skipRoutes.includes(req.path)) return next()

  const originalJson = res.json.bind(res)

  res.json = async (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        // extract route segment — /api/v1/customers/1 → customers
        const routeSegment = req.originalUrl.split('/')[3]?.split('?')[0]
        const table_name = ROUTE_TABLE_MAP[routeSegment] || routeSegment || 'unknown'
        const action = `${req.method}_${table_name.toUpperCase()}`

        await log({
          user_id: req.user?.userId || null,
          action,
          table_name,
          record_id: body?.data?.id || req.params?.id || null,
          new_data: req.body || null,
          ip_address: req.ip || req.headers['x-forwarded-for'] || null
        })
      } catch (err) {
        console.error('Audit middleware error:', err.message)
      }
    }
    return originalJson(body)
  }

  next()
}