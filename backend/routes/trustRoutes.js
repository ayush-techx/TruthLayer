const express = require('express')
const { createTrustSignal, getTrustContext } = require('../controllers/trustController')

const router = express.Router()

/**
 * POST /api/trust-signal
 * Store a new community trust verification.
 */
router.post('/trust-signal', createTrustSignal)

/**
 * GET /api/trust-context?url=<encoded_url>
 * Retrieve aggregated crowd trust data for a URL.
 */
router.get('/trust-context', getTrustContext)

module.exports = router
