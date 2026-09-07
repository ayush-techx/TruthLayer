require('dotenv').config()

const express = require('express')
const cors = require('cors')
const trustRoutes = require('./routes/trustRoutes')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3002

// ---- CORS — allow requests from the browser extension ----
app.use(cors({ origin: '*' }))

// ---- Body parsing ----
app.use(express.json({ limit: '512kb' }))

// ---- Routes ----
app.use('/api', trustRoutes)

// ---- Health check ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'truthlayer-backend',
    timestamp: new Date().toISOString(),
  })
})

// ---- 404 fallback ----
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ---- Centralized error handling ----
app.use(errorHandler)

// ---- Start ----
app.listen(PORT, () => {
  console.log(`[TruthLayer Backend] Running on http://localhost:${PORT}`)
  console.log(`[TruthLayer Backend] POST http://localhost:${PORT}/api/trust-signal`)
  console.log(`[TruthLayer Backend] GET  http://localhost:${PORT}/api/trust-context?url=...`)
})

module.exports = app
