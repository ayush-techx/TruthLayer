const axios = require('axios')

/**
 * Pre-configured Axios client for the local Ollama REST API.
 *
 * Ollama exposes a generate / chat endpoint at http://localhost:11434.
 * We set generous timeouts because local inference can take a while
 * depending on the model size and hardware.
 */
const ollamaClient = axios.create({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  timeout: 120_000, // 2 minutes — large models can be slow
  headers: {
    'Content-Type': 'application/json',
  },
})

module.exports = ollamaClient
