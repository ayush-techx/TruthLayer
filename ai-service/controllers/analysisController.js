const ollamaClient = require('../config/ollama')

/**
 * The model to use for inference.
 * Override via the OLLAMA_MODEL environment variable.
 * Common choices: "llama3", "gemma3:4b", "gemma3:12b", "mistral", "phi3"
 */
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b'

/**
 * System prompt that instructs the model to act as a fact-checker.
 * It explicitly requests a JSON-only response to make parsing reliable.
 */
const SYSTEM_PROMPT = `You are a rigorous factual-consistency analyst. Your task is to evaluate the text provided by the user for factual accuracy, logical consistency, and potential misinformation.

Respond with ONLY a valid JSON object — no markdown, no code fences, no commentary outside the JSON. The JSON must contain exactly two fields:

1. "truth_score" — an integer from 0 to 100 representing overall factual reliability:
   • 90-100: Highly credible, well-sourced, factually accurate
   • 70-89:  Mostly accurate with minor issues
   • 40-69:  Mixed reliability, contains unverified or misleading claims
   • 0-39:   Largely inaccurate, misleading, or fabricated

2. "reasoning_summary" — a concise 2-3 sentence explanation of your evaluation, noting specific factual issues or strengths.

Example response:
{"truth_score": 78, "reasoning_summary": "The core statistical claims are accurate according to WHO data, but the article omits important context about sample size limitations and conflates correlation with causation in paragraph 3."}`

/**
 * POST /api/analyze
 *
 * Accepts: { "text": "..." }
 * Returns: { "truth_score": number, "reasoning_summary": string }
 */
async function analyzeText(req, res) {
  const { text } = req.body

  // ---- Input validation ----
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'The "text" field is required and must be a non-empty string.',
    })
  }

  if (text.length > 50_000) {
    return res.status(400).json({
      error: 'Payload too large',
      message: 'Text must be under 50 000 characters.',
    })
  }

  try {
    // ---- Call Ollama chat completions API ----
    const response = await ollamaClient.post('/api/chat', {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.trim() },
      ],
      stream: false,
      format: 'json',
    })

    const raw = response.data?.message?.content
    if (!raw) {
      return res.status(502).json({
        error: 'Empty model response',
        message: 'The model returned an empty response. Try again or check the Ollama logs.',
      })
    }

    // ---- Parse the model's JSON output ----
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return res.status(502).json({
        error: 'Malformed model output',
        message: 'The model did not return valid JSON.',
        raw_output: raw,
      })
    }

    // ---- Validate the parsed structure ----
    const truthScore = Number(parsed.truth_score)
    const reasoningSummary = parsed.reasoning_summary

    if (
      Number.isNaN(truthScore) ||
      truthScore < 0 ||
      truthScore > 100 ||
      typeof reasoningSummary !== 'string' ||
      reasoningSummary.trim().length === 0
    ) {
      return res.status(502).json({
        error: 'Invalid model output',
        message: 'The model response did not match the expected schema.',
        raw_output: parsed,
      })
    }

    return res.json({
      truth_score: Math.round(truthScore),
      reasoning_summary: reasoningSummary.trim(),
    })

  } catch (err) {
    // Axios wraps the underlying Node error — check both err.code and err.cause?.code
    const rootCode = err.code || err.cause?.code

    // ---- Ollama daemon not running ----
    if (rootCode === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Ollama unavailable',
        message:
          'Could not connect to the Ollama daemon. Make sure Ollama is running locally (`ollama serve`) and listening on ' +
          (process.env.OLLAMA_BASE_URL || 'http://localhost:11434') +
          '.',
      })
    }

    // ---- Timeouts ----
    if (rootCode === 'ECONNRESET' || rootCode === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'Inference timeout',
        message: 'The model took too long to respond. Try a smaller model or shorter text.',
      })
    }

    // ---- Ollama HTTP errors (e.g. 404 model not found) ----
    if (err.response) {
      const ollamaError = err.response.data?.error || err.response.statusText
      return res.status(502).json({
        error: 'Ollama error',
        message: `Ollama returned ${err.response.status}: ${ollamaError}`,
      })
    }

    console.error('[TruthLayer] Analysis error:', err.message)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during analysis.',
    })
  }
}

module.exports = { analyzeText }
