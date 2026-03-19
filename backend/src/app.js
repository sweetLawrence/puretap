import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { auditLog } from './middlewares/auditLog.js'

dotenv.config()

const app = express()

app.get('/', (req, res) => {
  res.json({ message: 'PURETAP SYSTEM IS ACTIVE' })
})


app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(auditLog)

app.use('/api/v1', routes)
app.use(errorHandler)

export default app
// ```

// ---

// ### Test in Postman

// **Register**
// ```
// POST http://localhost:5000/api/v1/auth/register
// Content-Type: application/json

// {
//   "full_name": "James Otieno",
//   "phone": "+254701234561",
//   "email": "james.otieno@puretap.co.ke",
//   "password": "Admin@1234",
//   "role": "admin"
// }
// ```

// **Login**
// ```
// POST http://localhost:5000/api/v1/auth/login
// Content-Type: application/json

// {
//   "email": "james.otieno@puretap.co.ke",
//   "password": "Admin@1234"
// }