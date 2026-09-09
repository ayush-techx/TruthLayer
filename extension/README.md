# TruthLayer — browser extension

Manifest V3 extension built with Vite and React. See the [root README](../README.md) for the full architecture.

## What it does

A content script runs on all URLs and mounts:

- **`TrustBadge`** — inline score indicator on evaluated content
- **`TruthSidebar`** — expanded panel showing the reasoning summary and community trust signals

A background service worker brokers requests to the two local services. Host permissions are limited to `localhost` and `127.0.0.1`, so the extension cannot reach any remote host.

## Development

```bash
npm install
npm run dev      # Vite dev server for UI work
npm run build    # emits dist/ for loading as an unpacked extension
```

Load `dist/` via `chrome://extensions` with developer mode enabled.

Both local services must be running for the extension to return results — `ai-service` on port 3001 and `backend` on port 3002.
