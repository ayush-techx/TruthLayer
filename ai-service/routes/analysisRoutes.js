const express = require('express')
const { analyzeText } = require('../controllers/analysisController')

const router = express.Router()

/**
 * POST /api/analyze
 * Body: { "text": "..." }
 * Response: { "truth_score": number, "reasoning_summary": string }
 */
router.post('/analyze', analyzeText)

module.exports = router
