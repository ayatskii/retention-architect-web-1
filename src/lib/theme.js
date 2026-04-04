/**
 * Theme color helpers
 * -------------------
 * Use these instead of hardcoding '#ccff00' in inline JSX styles.
 * They automatically return the correct accent for dark vs light mode.
 *
 * Dark  → neon lime  #ccff00  (high contrast on black)
 * Light → forest green #047857 (WCAG AA on white)
 */

export const ACCENT_DARK  = '#ccff00'
export const ACCENT_LIGHT = '#047857'

/** Primary accent hex */
export function getAccent(isDark) {
  return isDark ? ACCENT_DARK : ACCENT_LIGHT
}

/**
 * Accent with alpha channel as rgba string.
 * @param {boolean} isDark
 * @param {number}  alpha  0–1
 */
export function accentAlpha(isDark, alpha) {
  if (isDark) {
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
    return `#ccff00${a}`
  }
  // Forest green rgb(4, 120, 87)
  return `rgba(4,120,87,${alpha})`
}

/**
 * CSS box-shadow glow string for the accent colour.
 * @param {boolean} isDark
 * @param {'sm'|'md'|'lg'} size
 */
export function accentGlow(isDark, size = 'md') {
  if (isDark) {
    const glows = {
      sm: '0 0 10px rgba(204,255,0,0.35)',
      md: '0 0 18px rgba(204,255,0,0.45)',
      lg: '0 0 28px rgba(204,255,0,0.6), 0 0 56px rgba(204,255,0,0.2)',
    }
    return glows[size] ?? glows.md
  }
  const glows = {
    sm: '0 0 6px rgba(4,120,87,0.25)',
    md: '0 0 10px rgba(4,120,87,0.30)',
    lg: '0 0 16px rgba(4,120,87,0.40)',
  }
  return glows[size] ?? glows.md
}

/**
 * CSS text-shadow for neon accent glow (dark only; returns 'none' in light).
 */
export function accentTextShadow(isDark) {
  if (!isDark) return 'none'
  return '0 0 10px rgba(204,255,0,0.9), 0 0 24px rgba(204,255,0,0.5), 0 0 48px rgba(204,255,0,0.28)'
}

/**
 * Returns the correct foreground color to place on an accent background.
 * Lime bg → black text.  Forest green bg → white text.
 */
export function accentFg(isDark) {
  return isDark ? '#000000' : '#ffffff'
}
