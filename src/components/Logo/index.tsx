import type { CSSProperties } from 'react'

type LogoProps = {
  /** Extra classes on the root. Control the size with a text-size utility (e.g. `text-2xl`). */
  className?: string
  /** `auto` follows the theme (ink text); `light` forces white text for dark backgrounds. */
  tone?: 'auto' | 'light'
  /** Render only the pin mark, without the "nde hoje." wordmark. */
  markOnly?: boolean
}

const PIN_TEAL = '#14b8a6'

// Teardrop pin with a punched-out center (evenodd) so the background shows
// through — reads as a ring on any surface, light or dark.
// The round "O" spans y=3..45 in the viewBox; the tail runs down to y=53.
function Pin({ style }: { style?: CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      className="w-auto shrink-0"
      fill={PIN_TEAL}
      style={style}
      viewBox="0 0 48 56"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M24 3C12.4 3 3 12.4 3 24c0 9.4 8 19 21 29 13-10 21-19.6 21-29C45 12.4 35.6 3 24 3Zm0 9.5A11.5 11.5 0 1 0 24 35.5 11.5 11.5 0 0 0 24 12.5Z"
        fillRule="evenodd"
      />
    </svg>
  )
}

export function Logo({ className, tone = 'auto', markOnly = false }: LogoProps) {
  if (markOnly) {
    return (
      <span className={`inline-flex items-center ${className ?? ''}`}>
        <Pin style={{ height: '1em' }} />
      </span>
    )
  }

  return (
    // items-baseline puts the SVG's bottom edge on the text baseline; the small
    // translateY then drops the pin so the round "O" sits from the baseline up
    // to the cap height (same height as the letters) with the tail hanging below.
    <span
      className={`inline-flex select-none items-baseline gap-[0.04em] leading-none ${className ?? ''}`}
      style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
    >
      <Pin style={{ height: '1em', transform: 'translateY(0.2em)' }} />
      <span
        className={tone === 'light' ? 'text-white' : 'text-ink'}
        style={{ fontWeight: 700, letterSpacing: '-0.03em' }}
      >
        nde&nbsp;hoje<span style={{ color: PIN_TEAL }}>.</span>
      </span>
    </span>
  )
}
