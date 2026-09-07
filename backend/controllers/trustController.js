const prisma = require('../config/database')

/**
 * POST /api/trust-signal
 *
 * Accepts a community trust signal for a specific URL and text snippet.
 *
 * Body: {
 *   "url":     string  (required) — the page URL being verified
 *   "snippet": string  (required) — the specific text being evaluated
 *   "score":   number  (required) — trust score 0-100
 *   "note":    string  (optional) — context note explaining the score
 *   "author":  string  (required) — contributor display name
 * }
 */
async function createTrustSignal(req, res, next) {
  try {
    const { url, snippet, score, note, author } = req.body

    // ---- Validation ----
    const errors = []

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      errors.push('"url" is required and must be a non-empty string.')
    }
    if (!snippet || typeof snippet !== 'string' || snippet.trim().length === 0) {
      errors.push('"snippet" is required and must be a non-empty string.')
    }
    if (score === undefined || score === null || typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) {
      errors.push('"score" is required and must be an integer between 0 and 100.')
    }
    if (!author || typeof author !== 'string' || author.trim().length === 0) {
      errors.push('"author" is required and must be a non-empty string.')
    }
    if (note !== undefined && note !== null && typeof note !== 'string') {
      errors.push('"note" must be a string if provided.')
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors,
      })
    }

    // ---- Create record ----
    const signal = await prisma.trustSignal.create({
      data: {
        url: url.trim(),
        snippet: snippet.trim(),
        score,
        note: note?.trim() || null,
        author: author.trim(),
      },
    })

    return res.status(201).json({
      message: 'Trust signal recorded successfully.',
      signal: {
        id: signal.id,
        url: signal.url,
        snippet: signal.snippet,
        score: signal.score,
        note: signal.note,
        author: signal.author,
        createdAt: signal.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/trust-context?url=<encoded_url>
 *
 * Returns the aggregated crowd trust data for a specific URL:
 * - Aggregated average score
 * - Total number of signals
 * - Number of unique contributors
 * - Score breakdown by tier (high/mid/low)
 * - Top 10 most recent context notes
 */
async function getTrustContext(req, res, next) {
  try {
    const { url } = req.query

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'The "url" query parameter is required.',
      })
    }

    const targetUrl = url.trim()

    // ---- Fetch all signals for this URL ----
    const signals = await prisma.trustSignal.findMany({
      where: { url: targetUrl },
      orderBy: { createdAt: 'desc' },
    })

    if (signals.length === 0) {
      return res.json({
        url: targetUrl,
        total_signals: 0,
        crowd_score: null,
        unique_contributors: 0,
        score_breakdown: { high: 0, mid: 0, low: 0 },
        top_notes: [],
      })
    }

    // ---- Aggregate ----
    const totalScore = signals.reduce((sum, s) => sum + s.score, 0)
    const crowdScore = Math.round(totalScore / signals.length)

    const uniqueAuthors = new Set(signals.map((s) => s.author)).size

    const breakdown = { high: 0, mid: 0, low: 0 }
    for (const s of signals) {
      if (s.score >= 70) breakdown.high++
      else if (s.score >= 40) breakdown.mid++
      else breakdown.low++
    }

    // Top 10 most recent notes (only those with a non-null note)
    const topNotes = signals
      .filter((s) => s.note && s.note.trim().length > 0)
      .slice(0, 10)
      .map((s) => ({
        author: s.author,
        score: s.score,
        note: s.note,
        createdAt: s.createdAt,
      }))

    return res.json({
      url: targetUrl,
      total_signals: signals.length,
      crowd_score: crowdScore,
      unique_contributors: uniqueAuthors,
      score_breakdown: breakdown,
      top_notes: topNotes,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { createTrustSignal, getTrustContext }
