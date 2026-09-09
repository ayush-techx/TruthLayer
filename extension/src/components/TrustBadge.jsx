import { useRef, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * Styles injected into the Shadow DOM — fully isolated from the host page.
 */
const SHADOW_STYLES = `
  :host {
    display: inline-flex;
    vertical-align: middle;
    position: relative;
    z-index: 2147483647;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    line-height: 1;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .tl-badge {
    display: inline-flex;
    align-items: center;
    gap: 0;
    height: 22px;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                background 0.25s ease,
                box-shadow 0.25s ease;
    max-width: 24px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25),
                0 0 0 1px rgba(255, 255, 255, 0.06) inset;
  }

  .tl-badge:hover {
    max-width: 180px;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    box-shadow: 0 4px 14px rgba(56, 189, 248, 0.2),
                0 0 0 1px rgba(56, 189, 248, 0.15) inset;
  }

  .tl-badge:active {
    transform: scale(0.97);
  }

  /* ---- Icon ---- */
  .tl-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 3px;
  }

  .tl-icon svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 2px rgba(56, 189, 248, 0.5));
    transition: filter 0.25s ease;
  }

  .tl-badge:hover .tl-icon svg {
    filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.7));
  }

  /* ---- Score label (hidden until hover) ---- */
  .tl-label {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-right: 9px;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.25s ease 0.08s,
                transform 0.25s ease 0.08s;
    pointer-events: none;
  }

  .tl-badge:hover .tl-label {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  .tl-score-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #cbd5e1;
  }

  .tl-score-value {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  /* Color tiers */
  .tl-score-value.high  { color: #34d399; }
  .tl-score-value.mid   { color: #fbbf24; }
  .tl-score-value.low   { color: #f87171; }

  .tl-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .tl-dot.high  { background: #34d399; box-shadow: 0 0 6px #34d399; }
  .tl-dot.mid   { background: #fbbf24; box-shadow: 0 0 6px #fbbf24; }
  .tl-dot.low   { background: #f87171; box-shadow: 0 0 6px #f87171; }
`

/**
 * Shield SVG icon rendered inline.
 */
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L3 7v5c0 5.25 3.83 10.17 9 11.38C17.17 22.17 21 17.25 21 12V7l-9-5z"
      fill="url(#shield-fill)"
      stroke="url(#shield-stroke)"
      strokeWidth="1.2"
    />
    <path
      d="M9.5 12.5l2 2 4-4.5"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="shield-fill" x1="3" y1="2" x2="21" y2="23.38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="shield-stroke" x1="3" y1="2" x2="21" y2="23.38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7dd3fc" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
    </defs>
  </svg>
)

/**
 * Return the color tier class based on score value.
 */
function scoreTier(score) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

/**
 * Inner component rendered inside the Shadow DOM.
 */
function BadgeInner({ score = 82, onClick }) {
  const tier = scoreTier(score)

  return (
    <div className="tl-badge" role="button" tabIndex={0} onClick={onClick} aria-label={`Truth Score: ${score}`}>
      <span className="tl-icon">
        <ShieldIcon />
      </span>
      <span className="tl-label">
        <span className={`tl-dot ${tier}`} aria-hidden="true" />
        <span className="tl-score-text">Trust</span>
        <span className={`tl-score-value ${tier}`}>{score}%</span>
      </span>
    </div>
  )
}




/**
 * TrustBadge — a floating inline badge that uses Shadow DOM for
 * complete style isolation from the host webpage.
 *
 * @param {object}   props
 * @param {number}   props.score    - Truth score 0–100 (default 82)
 * @param {function} props.onClick  - Callback when badge is clicked
 */
export default function TrustBadge({ score = 82, onClick }) {
  const hostRef = useRef(null)
  const shadowRootRef = useRef(null)
  const reactRootRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  // Attach the shadow root once on mount
  useEffect(() => {
    const host = hostRef.current
    if (!host || shadowRootRef.current) return

    const shadow = host.attachShadow({ mode: 'open' })
    shadowRootRef.current = shadow

    // Inject styles
    const style = document.createElement('style')
    style.textContent = SHADOW_STYLES
    shadow.appendChild(style)

    // Create a mount point inside the shadow
    const mountPoint = document.createElement('div')
    shadow.appendChild(mountPoint)

    // Create a React root inside the shadow DOM
    reactRootRef.current = createRoot(mountPoint)
    setMounted(true)

    return () => {
      // Cleanup on unmount
      reactRootRef.current?.unmount()
    }
  }, [])

  // Render / re-render the inner component when props change
  useEffect(() => {
    if (!mounted || !reactRootRef.current) return
    reactRootRef.current.render(<BadgeInner score={score} onClick={onClick} />)
  }, [mounted, score, onClick])

  // The host element is an inline span — invisible to host CSS
  return <span ref={hostRef} data-truthlayer-badge="" />
}
