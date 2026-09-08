const express = require('express')
const cors = require('cors')
const analysisRoutes = require('./routes/analysisRoutes')

const app = express()
const PORT = process.env.PORT || 3001

// ---- Middleware ----
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '1mb' }))

// ---- Routes ----
app.use('/api', analysisRoutes)

// ---- Health check ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'truthlayer-ai', timestamp: new Date().toISOString() })
})

// ---- 404 fallback ----
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ---- Global error handler ----
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500
  if (status < 500) {
    // Client errors (e.g. malformed JSON body from body-parser)
    return res.status(status).json({
      error: err.type || 'Bad request',
      message: err.message,
    })
  }
  console.error('[TruthLayer] Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ---- Start ----
app.listen(PORT, () => {
  console.log(`[TruthLayer AI Service] Running on http://localhost:${PORT}`)
  console.log(`[TruthLayer AI Service] POST http://localhost:${PORT}/api/analyze`)
  console.log(`[TruthLayer AI Service] Ollama target: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`)
})

module.exports = app
