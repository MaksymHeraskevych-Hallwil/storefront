import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes'
import productsRoutes from './routes/products.routes'
import ordersRoutes from './routes/orders.routes'

// Тільки збираємо застосунок, сервер НЕ піднімаємо — так тести зможуть
// передати `app` у supertest без реального відкриття порту.
const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true, // дозволяє браузеру надсилати httpOnly-куку
  })
)
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders', ordersRoutes)

app.get('/', (_req, res) => {
  res.json({ message: 'StoreFront API is running', version: '0.1' })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app
