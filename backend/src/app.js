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
// app.use(cors())
app.use(cors({
  origin: [
    "http://192.168.0.103:5173",
    "https://puretap.vercel.app",
    "https://portalpuretap.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176"
  ],
  credentials: true
}));
app.use(morgan('dev'))
app.use(express.json())
app.use(auditLog)

app.use('/api/v1', routes)
app.use(errorHandler)




app.get('/test-mail', async (req, res) => {
  const result = await sendEmail({
    to: "tsungulawrence@gmail.com",
    subject: "Mailgun Test",
    html: "<h1>It works 🎉</h1>"
  })

  res.json(result)
})

export default app
// ```

// ---
