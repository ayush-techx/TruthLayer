import { useRef, useEffect, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'

/* ================================================================
   Shadow DOM styles — fully isolated from the host page.
   ================================================================ */
const SHADOW_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :host {
    all: initial;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483647;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #e2e8f0;
    pointer-events: none;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ---- Backdrop overlay ---- */
  .tl-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .tl-overlay.visible {
    opacity: 1;
    pointer-events: auto;
  }

  /* ---- Sidebar panel ---- */
  .tl-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 380px;
    max-width: 92vw;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;

    /* Frosted glass */
    background: linear-gradient(
      165deg,
      rgba(15, 23, 42, 0.82) 0%,
      rgba(15, 23, 42, 0.92) 100%
    );
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border-left: 1px solid rgba(148, 163, 184, 0.08);
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);

    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .tl-sidebar.open {
    transform: translateX(0);
  }

  /* ---- Toggle button ---- */
  .tl-toggle {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    pointer-events: auto;
    z-index: 1;

    width: 36px;
    height: 80px;
    border: none;
    border-radius: 12px 0 0 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.9));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-left: 1px solid rgba(56, 189, 248, 0.15);
    border-top: 1px solid rgba(56, 189, 248, 0.1);
    border-bottom: 1px solid rgba(56, 189, 248, 0.1);
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.3),
                inset 1px 0 0 rgba(255, 255, 255, 0.04);
    transition: background 0.25s ease,
                box-shadow 0.25s ease,
                right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    color: #94a3b8;
  }
  .tl-toggle:hover {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 95, 0.95));
    box-shadow: -4px 0 20px rgba(56, 189, 248, 0.15),
                inset 1px 0 0 rgba(255, 255, 255, 0.06);
    color: #e2e8f0;
  }
  .tl-toggle.shifted {
    right: 380px;
  }
  @media (max-width: 414px) {
    .tl-toggle.shifted { right: 92vw; }
  }
  .tl-toggle svg {
    width: 18px;
    height: 18px;
    transition: transform 0.35s ease;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tl-toggle.shifted svg {
    transform: rotate(180deg);
  }

  /* ---- Header ---- */
  .tl-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 22px 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    flex-shrink: 0;
  }
  .tl-logo {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));
  }
  .tl-title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, #7dd3fc, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .tl-close {
    margin-left: auto;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: none;
    background: rgba(148, 163, 184, 0.08);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }
  .tl-close:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }
  .tl-close svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    fill: none;
  }

  /* ---- Scrollable content ---- */
  .tl-content {
    flex: 1;
    overflow-y: auto;
    padding: 18px 22px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    /* Custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.15) transparent;
  }
  .tl-content::-webkit-scrollbar { width: 5px; }
  .tl-content::-webkit-scrollbar-track { background: transparent; }
  .tl-content::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.18);
    border-radius: 999px;
  }

  /* ---- Section cards ---- */
  .tl-section {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.06);
    border-radius: 14px;
    padding: 18px;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .tl-section:hover {
    border-color: rgba(56, 189, 248, 0.12);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.04);
  }
  .tl-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .tl-section-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: #38bdf8;
  }
  .tl-section-icon svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tl-section-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
  }

  /* ---- AI Verification Score ---- */
  .tl-score-ring {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 12px;
  }
  .tl-ring-container {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }
  .tl-ring-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .tl-ring-bg {
    fill: none;
    stroke: rgba(148, 163, 184, 0.08);
    stroke-width: 5;
  }
  .tl-ring-fg {
    fill: none;
    stroke-width: 5;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1),
                stroke 0.4s ease;
  }
  .tl-ring-value {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .tl-ring-value.high  { color: #34d399; }
  .tl-ring-value.mid   { color: #fbbf24; }
  .tl-ring-value.low   { color: #f87171; }

  .tl-score-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tl-score-label {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
  }
  .tl-score-sublabel {
    font-size: 12px;
    color: #64748b;
  }

  .tl-factors {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tl-factor {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tl-factor-name {
    font-size: 12px;
    color: #94a3b8;
  }
  .tl-factor-bar-track {
    width: 100px;
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.1);
    overflow: hidden;
  }
  .tl-factor-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tl-factor-bar-fill.high  { background: linear-gradient(90deg, #34d399, #2dd4bf); }
  .tl-factor-bar-fill.mid   { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  .tl-factor-bar-fill.low   { background: linear-gradient(90deg, #f87171, #ef4444); }

  /* ---- Sources ---- */
  .tl-sources-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
  }
  .tl-source-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.04);
    transition: background 0.2s, border-color 0.2s;
  }
  .tl-source-item:hover {
    background: rgba(30, 58, 95, 0.3);
    border-color: rgba(56, 189, 248, 0.1);
  }
  .tl-source-favicon {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: rgba(148, 163, 184, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    font-size: 10px;
    color: #64748b;
    font-weight: 700;
  }
  .tl-source-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .tl-source-name {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tl-source-url {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tl-source-trust {
    margin-left: auto;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
  }
  .tl-source-trust.mid {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
  }
  .tl-source-trust.low {
    background: rgba(248, 113, 113, 0.1);
    color: #f87171;
  }

  /* ---- Crowd Context ---- */
  .tl-crowd-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }
  .tl-stat {
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.04);
    text-align: center;
  }
  .tl-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #e2e8f0;
    letter-spacing: -0.02em;
  }
  .tl-stat-label {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
  }

  .tl-sentiment-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .tl-sentiment-bar {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.08);
    overflow: hidden;
    display: flex;
  }
  .tl-sentiment-positive {
    height: 100%;
    background: linear-gradient(90deg, #34d399, #2dd4bf);
    border-radius: 999px 0 0 999px;
    transition: width 0.8s ease;
  }
  .tl-sentiment-negative {
    height: 100%;
    background: linear-gradient(90deg, #f87171, #ef4444);
    border-radius: 0 999px 999px 0;
    transition: width 0.8s ease;
  }
  .tl-sentiment-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }

  .tl-crowd-notes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 6px;
  }
  .tl-note {
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.04);
  }
  .tl-note-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .tl-note-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .tl-note-author {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .tl-note-time {
    margin-left: auto;
    font-size: 10px;
    color: #475569;
  }
  .tl-note-body {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;
  }

  /* ---- Footer ---- */
  .tl-footer {
    padding: 14px 22px;
    border-top: 1px solid rgba(148, 163, 184, 0.06);
    text-align: center;
    flex-shrink: 0;
  }
  .tl-footer-text {
    font-size: 11px;
    color: #475569;
  }
  .tl-footer-text span {
    background: linear-gradient(135deg, #38bdf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
  }
  /* ---- Form Elements ---- */
  .tl-button {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    color: white;
    transition: opacity 0.2s, transform 0.1s;
  }
  .tl-button:hover { opacity: 0.9; }
  .tl-button:active { transform: scale(0.98); }
  .tl-button:disabled { opacity: 0.5; cursor: not-allowed; }

  .tl-input, .tl-textarea {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0;
    font-size: 13px;
    margin-bottom: 10px;
  }
  .tl-textarea {
    resize: vertical;
    min-height: 60px;
  }
  .tl-label {
    display: block;
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
  }
  .tl-loading {
    text-align: center;
    padding: 20px;
    color: #94a3b8;
    font-size: 13px;
  }
  .tl-error {
    color: #f87171;
    font-size: 12px;
    padding: 10px;
    background: rgba(248, 113, 113, 0.1);
    border-radius: 8px;
    margin-bottom: 10px;
  }
  .tl-selected-text-preview {
    font-style: italic;
    font-size: 12px;
    color: #cbd5e1;
    border-left: 2px solid #38bdf8;
    padding-left: 10px;
    margin: 10px 0;
    background: rgba(56, 189, 248, 0.05);
    padding: 8px;
    border-radius: 0 4px 4px 0;
  }
`

/* ================================================================
   SVG Icons
   ================================================================ */
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 2L3 7v5c0 5.25 3.83 10.17 9 11.38C17.17 22.17 21 17.25 21 12V7l-9-5z" />
    <path d="M9.5 12.5l2 2 4-4.5" />
  </svg>
)

const ShieldLogo = () => (
  <svg className="tl-logo" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L3 7v5c0 5.25 3.83 10.17 9 11.38C17.17 22.17 21 17.25 21 12V7l-9-5z"
      fill="url(#sf)" stroke="url(#ss)" strokeWidth="1"
    />
    <path d="M9.5 12.5l2 2 4-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="sf" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="ss" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7dd3fc" /><stop offset="1" stopColor="#818cf8" />
      </linearGradient>
    </defs>
  </svg>
)

const LinkIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

/* ================================================================
   Helpers
   ================================================================ */
function scoreTier(s) {
  if (s >= 70) return 'high'
  if (s >= 40) return 'mid'
  return 'low'
}

/* ================================================================
   Inner Component (rendered inside the Shadow DOM)
   ================================================================ */
const MOCK_SOURCES = []

function SidebarInner({ isOpen, onToggle, onClose }) {
  const [aiData, setAiData] = useState(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [aiError, setAiError] = useState(null)

  const [crowdData, setCrowdData] = useState(null)
  const [isLoadingCrowd, setIsLoadingCrowd] = useState(false)
  const [crowdError, setCrowdError] = useState(null)

  const [selectedText, setSelectedText] = useState('')
  
  const [submitScore, setSubmitScore] = useState(50)
  const [submitNote, setSubmitNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Fetch Crowd Context when opened
  useEffect(() => {
    if (isOpen && !crowdData && !isLoadingCrowd) {
      const fetchCrowdData = async () => {
        setIsLoadingCrowd(true)
        setCrowdError(null)
        try {
          const currentUrl = encodeURIComponent(window.location.hostname + window.location.pathname)
          
          chrome.runtime.sendMessage(
            { 
              type: 'FETCH_API', 
              url: `http://localhost:3002/api/trust-context?url=${currentUrl}`,
              options: { method: 'GET' }
            },
            (response) => {
              setIsLoadingCrowd(false)
              if (response && response.success) {
                setCrowdData(response.data)
              } else {
                setCrowdError(response?.error || 'Failed to fetch crowd context')
              }
            }
          )
        } catch (err) {
          setCrowdError(err.message)
          setIsLoadingCrowd(false)
        }
      }
      fetchCrowdData()
    }
  }, [isOpen])

  // Capture selected text
  useEffect(() => {
    const handleMouseUp = () => {
      const text = window.getSelection().toString().trim()
      if (text.length > 10) setSelectedText(text)
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const handleAnalyze = () => {
    if (!selectedText) return
    setIsLoadingAi(true)
    setAiError(null)
    setAiData(null)
    
    chrome.runtime.sendMessage(
      {
        type: 'FETCH_API',
        url: 'http://localhost:3001/api/analyze',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: selectedText })
        }
      },
      (response) => {
        setIsLoadingAi(false)
        if (response && response.success) {
          setAiData(response.data)
        } else {
          setAiError(response?.error || 'Analysis failed')
        }
      }
    )
  }

  const handleSubmitSignal = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitSuccess(false)
    
    const currentUrl = window.location.hostname + window.location.pathname
    const snippet = selectedText || 'General Page Context'
    
    chrome.runtime.sendMessage(
      {
        type: 'FETCH_API',
        url: 'http://localhost:3002/api/trust-signal',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: currentUrl,
            snippet: snippet,
            score: parseInt(submitScore),
            note: submitNote,
            author: 'Anonymous User'
          })
        }
      },
      (response) => {
        setIsSubmitting(false)
        if (response && response.success) {
          setSubmitSuccess(true)
          setSubmitNote('')
          
          // Refresh crowd data
          chrome.runtime.sendMessage({
            type: 'FETCH_API',
            url: `http://localhost:3002/api/trust-context?url=${encodeURIComponent(currentUrl)}`,
            options: { method: 'GET' }
          }, (refreshRes) => {
            if (refreshRes && refreshRes.success) {
              setCrowdData(refreshRes.data)
            }
          })
        } else {
          console.error(response?.error)
        }
      }
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`tl-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Toggle tab */}
      <button
        className={`tl-toggle ${isOpen ? 'shifted' : ''}`}
        onClick={onToggle}
        aria-label={isOpen ? 'Close TruthLayer sidebar' : 'Open TruthLayer sidebar'}
      >
        <ChevronIcon />
      </button>

      {/* Sidebar panel */}
      <aside className={`tl-sidebar ${isOpen ? 'open' : ''}`} role="complementary" aria-label="TruthLayer Sidebar">

        {/* ---- Header ---- */}
        <header className="tl-header">
          <ShieldLogo />
          <span className="tl-title">TruthLayer</span>
          <button className="tl-close" onClick={onClose} aria-label="Close sidebar">
            <CloseIcon />
          </button>
        </header>

        {/* ---- Scrollable content ---- */}
        <div className="tl-content">

          {/* === AI Verification Score === */}
          <section className="tl-section">
            <div className="tl-section-header">
              <span className="tl-section-icon"><ShieldCheckIcon /></span>
              <span className="tl-section-title">AI Verification Score</span>
            </div>

            {aiError && <div className="tl-error">{aiError}</div>}
            
            {isLoadingAi ? (
              <div className="tl-loading">Analyzing with local AI...<br/><small>(This may take a minute)</small></div>
            ) : aiData ? (
              <div className="tl-score-ring">
                <div className="tl-ring-container">
                  <svg className="tl-ring-svg" viewBox="0 0 68 68">
                    <circle className="tl-ring-bg" cx="34" cy="34" r="30" />
                    <circle
                      className="tl-ring-fg"
                      cx="34" cy="34" r="30"
                      stroke={scoreTier(aiData.truth_score) === 'high' ? '#34d399' : scoreTier(aiData.truth_score) === 'mid' ? '#fbbf24' : '#f87171'}
                      strokeDasharray={2 * Math.PI * 30}
                      strokeDashoffset={(2 * Math.PI * 30) - (aiData.truth_score / 100) * (2 * Math.PI * 30)}
                    />
                  </svg>
                  <span className={`tl-ring-value ${scoreTier(aiData.truth_score)}`}>{aiData.truth_score}</span>
                </div>
                <div className="tl-score-details">
                  <span className="tl-score-label">
                    {scoreTier(aiData.truth_score) === 'high' ? 'Highly Credible' : scoreTier(aiData.truth_score) === 'mid' ? 'Needs Review' : 'Low Confidence'}
                  </span>
                  <span className="tl-score-sublabel" style={{lineHeight: 1.2}}>{aiData.reasoning_summary}</span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '10px'}}>Highlight text on the page to analyze it locally.</p>
                {selectedText && (
                  <>
                    <div className="tl-selected-text-preview">"{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"</div>
                    <button className="tl-button" onClick={handleAnalyze}>Analyze Selected Text</button>
                  </>
                )}
              </div>
            )}
          </section>

          {/* === Crowd Context === */}
          <section className="tl-section">
            <div className="tl-section-header">
              <span className="tl-section-icon"><UsersIcon /></span>
              <span className="tl-section-title">Crowd Context</span>
            </div>

            {isLoadingCrowd ? (
              <div className="tl-loading">Loading crowd context...</div>
            ) : crowdError ? (
              <div className="tl-error">{crowdError}</div>
            ) : crowdData && crowdData.total_signals > 0 ? (
              <>
                <div className="tl-crowd-stats">
                  <div className="tl-stat">
                    <div className="tl-stat-value">{crowdData.total_signals}</div>
                    <div className="tl-stat-label">Reviews</div>
                  </div>
                  <div className="tl-stat">
                    <div className="tl-stat-value">{crowdData.crowd_score}</div>
                    <div className="tl-stat-label">Avg Score</div>
                  </div>
                </div>

                <div className="tl-sentiment-row">
                  <div className="tl-sentiment-bar">
                    <div className="tl-sentiment-positive" style={{ width: `${(crowdData.score_breakdown.high / crowdData.total_signals) * 100}%` }} />
                    <div className="tl-sentiment-negative" style={{ width: `${(crowdData.score_breakdown.low / crowdData.total_signals) * 100}%` }} />
                  </div>
                </div>
                <div className="tl-sentiment-labels">
                  <span>{Math.round((crowdData.score_breakdown.high / crowdData.total_signals) * 100) || 0}% Positive</span>
                  <span>{Math.round((crowdData.score_breakdown.low / crowdData.total_signals) * 100) || 0}% Negative</span>
                </div>

                <div className="tl-crowd-notes">
                  {crowdData.top_notes.map((n, i) => (
                    <div className="tl-note" key={i}>
                      <div className="tl-note-header">
                        <span className="tl-note-avatar">{n.author.charAt(0).toUpperCase()}</span>
                        <span className="tl-note-author">{n.author}</span>
                        <span className="tl-note-time">Score: {n.score}</span>
                      </div>
                      <div className="tl-note-body">{n.note}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{fontSize: '12px', color: '#94a3b8'}}>No crowd context available for this page yet. Be the first to verify!</p>
            )}
            
            <div style={{marginTop: '20px', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '16px'}}>
              <h4 style={{fontSize: '13px', color: '#e2e8f0', marginBottom: '10px'}}>Submit Trust Signal</h4>
              <form onSubmit={handleSubmitSignal}>
                <label className="tl-label">Trust Score (0-100): {submitScore}</label>
                <input 
                  type="range" min="0" max="100" 
                  value={submitScore} 
                  onChange={e => setSubmitScore(e.target.value)}
                  style={{width: '100%', marginBottom: '10px'}}
                />
                
                <label className="tl-label">Context Note (optional):</label>
                <textarea 
                  className="tl-textarea" 
                  placeholder="Explain why you trust or distrust this content..."
                  value={submitNote}
                  onChange={e => setSubmitNote(e.target.value)}
                />
                
                <button type="submit" className="tl-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                </button>
                {submitSuccess && <p style={{color: '#34d399', fontSize: '12px', marginTop: '8px'}}>Successfully submitted!</p>}
              </form>
            </div>
          </section>
        </div>

        {/* ---- Footer ---- */}
        <footer className="tl-footer">
          <div className="tl-footer-text">Powered by <span>TruthLayer AI</span></div>
        </footer>
      </aside>
    </>
  )
}

/* ================================================================
   Outer Component — attaches the Shadow DOM host
   ================================================================ */

/**
 * TruthSidebar — a frosted-glass sidebar that slides in from the right
 * edge of the screen. Uses Shadow DOM for complete CSS isolation.
 *
 * @param {object}   props
 * @param {boolean}  props.defaultOpen - Whether the sidebar starts open (default false)
 */
export default function TruthSidebar({ defaultOpen = false }) {
  const hostRef = useRef(null)
  const shadowRootRef = useRef(null)
  const reactRootRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const handleClose = useCallback(() => setIsOpen(false), [])

  // Attach shadow root once
  useEffect(() => {
    const host = hostRef.current
    if (!host || shadowRootRef.current) return

    const shadow = host.attachShadow({ mode: 'open' })
    shadowRootRef.current = shadow

    const style = document.createElement('style')
    style.textContent = SHADOW_STYLES
    shadow.appendChild(style)

    const mountPoint = document.createElement('div')
    shadow.appendChild(mountPoint)

    reactRootRef.current = createRoot(mountPoint)
    setMounted(true)

    return () => {
      reactRootRef.current?.unmount()
    }
  }, [])

  // Render inner component when state/props change
  useEffect(() => {
    if (!mounted || !reactRootRef.current) return
    reactRootRef.current.render(
      <SidebarInner isOpen={isOpen} onToggle={handleToggle} onClose={handleClose} />
    )
  }, [mounted, isOpen, handleToggle, handleClose])

  return <div ref={hostRef} data-truthlayer-sidebar="" />
}
