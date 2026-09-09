# TruthLayer

**Bringing a layer of trust to the web** — surfacing credibility signals on the content you are already reading, without shipping that content to anyone else's server.

TruthLayer is a browser extension backed by two local services: an AI analysis service that runs entirely on a local Ollama model, and a trust-signal backend that stores community assessments. Highlight a claim on any page and TruthLayer returns a trust score and the reasoning behind it, alongside whatever the community has already said about that URL.

## Architecture

```text
┌──────────────────────────────┐
│  Browser extension (MV3)     │
│  content script + sidebar    │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌───────────────┐  ┌──────────────────┐
│  ai-service   │  │     backend      │
│  :3001        │  │     :3002        │
│               │  │                  │
│  POST         │  │  POST  /api/     │
│  /api/analyze │  │    trust-signal  │
│               │  │  GET   /api/     │
│               │  │    trust-context │
└───────┬───────┘  └────────┬─────────┘
        │                   │
        ▼                   ▼
┌───────────────┐  ┌──────────────────┐
│    Ollama     │  │  SQLite (Prisma) │
│   :11434      │  │                  │
└───────────────┘  └──────────────────┘
```

Both services bind to localhost and the extension requests host permissions only for `localhost` and `127.0.0.1`. Nothing leaves the machine.

## Components

### `extension/` — browser extension

Manifest V3, built with Vite and React. A content script runs on all URLs and mounts two components: `TrustBadge` (the inline score indicator) and `TruthSidebar` (the expanded panel with reasoning and community signals). A background service worker brokers requests to the local services.

### `ai-service/` — AI analysis (port 3001)

Express service wrapping a local Ollama instance.

- `POST /api/analyze` — body `{ "text": "..." }`, returns `{ "truth_score": number, "reasoning_summary": string }`
- `GET /health`

Inference runs against Ollama's `/api/chat` endpoint with a fact-checker system prompt that constrains output to JSON so parsing stays reliable. The default model is `gemma3:4b`, overridable with `OLLAMA_MODEL` (`llama3`, `mistral`, `phi3` and others all work). Malformed model output, schema mismatches, connection failures and timeouts are each handled and reported distinctly rather than collapsing into a generic 500.

### `backend/` — trust signals (port 3002)

Express + Prisma over SQLite.

- `POST /api/trust-signal` — submit a score for a URL and text snippet
- `GET /api/trust-context?url=...` — retrieve signals recorded for a URL

The `TrustSignal` model records the URL, the specific snippet, a 0–100 score, an optional explanatory note, the contributor's display name and a timestamp, indexed on URL and creation time.

## Running locally

Prerequisites: Node.js 18+, and [Ollama](https://ollama.com) running locally with a model pulled.

```bash
ollama serve
ollama pull gemma3:4b
```

```bash
# AI service — port 3001
cd ai-service && npm install && node index.js
```

```bash
# Backend — port 3002
cd backend && npm install
cp ../.env.example .env      # then adjust if needed
npx prisma migrate dev
node index.js
```

```bash
# Extension
cd extension && npm install && npm run build
```

Then load `extension/dist` as an unpacked extension via `chrome://extensions` with developer mode enabled.

## Status

Working end-to-end locally: the extension talks to both services, analysis runs against a local model, and trust signals persist. Not packaged for a store listing, and the community reputation layer described in the original concept is not built yet.

## Why local models

Reading habits are unusually revealing data. An extension that watches every page you visit and forwards excerpts to a hosted API is a worse trade than most people realise they are making. Running inference against a local model keeps the analysis useful while leaving the browsing on the machine — the accuracy ceiling is lower than a frontier model, and that is the deliberate trade.
