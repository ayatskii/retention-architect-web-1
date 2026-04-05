/**
 * ThresholdOptimizer.jsx
 * Interactive precision-recall tradeoff visualization.
 * Slider controls classification threshold → chart updates live.
 * Optimal threshold: 0.528 (El Attar & El-Hajj, Frontiers in AI, 2026).
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { Zap } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent } from '../lib/theme.js'
import { clsx } from 'clsx'

const OPTIMAL_THRESHOLD = 0.528

// ── Generate sigmoid-based P-R curve once ──────
// 9 steps × exact ticks [0.10, 0.20, ... 0.90] + intermediate points
// Use 81 points (0.10 to 0.90 step 0.01) with explicit threshold values
function sigmoid(x, center, k) {
  return 1 / (1 + Math.exp(-k * (x - center)))
}

const CURVE_DATA = (() => {
  const pts = []
  for (let i = 0; i <= 80; i++) {
    const t  = Math.round((0.10 + i * 0.01) * 100) / 100  // avoid float drift
    const p  = +(0.55 + 0.40 * sigmoid(t, 0.50, 12)).toFixed(4)
    const r  = +(0.95 - 0.50 * sigmoid(t, 0.50, 10)).toFixed(4)
    const f1 = +(2 * p * r / (p + r)).toFixed(4)
    pts.push({ threshold: t, precision: p, recall: r, f1 })
  }
  return pts
})()

// Manual x-axis ticks — avoids Recharts auto-deduplication issue
const X_TICKS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

// ── Tooltip ─────────────────────────────────────
function PRTooltip({ active, payload, label }) {
  const { isDark } = useTheme()
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-xl"
      style={{
        background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(250,250,250,0.97)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      }}>
      <p className={clsx('font-bold mb-1', isDark ? 'text-white/60' : 'text-black/60')}>
        {t.threshold.threshold + ':'} {Number(label).toFixed(2)}
      </p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            {p.name}:{' '}
            <span className="font-bold" style={{ color: p.color }}>
              {Number(p.value).toFixed(3)}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ThresholdOptimizer() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const accent    = getAccent(isDark)
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const tickFill  = isDark ? '#666' : '#aaa'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'

  const [threshold, setThreshold] = useState(0.50)

  // Snap to nearest 0.01 step index
  const current = useMemo(() => {
    const idx  = Math.round((threshold - 0.10) / 0.01)
    const safe = Math.max(0, Math.min(idx, CURVE_DATA.length - 1))
    return CURVE_DATA[safe]
  }, [threshold])

  const optimal   = CURVE_DATA[Math.round((OPTIMAL_THRESHOLD - 0.10) / 0.01)] ?? CURVE_DATA[42]
  const isOptimal = Math.abs(threshold - OPTIMAL_THRESHOLD) < 0.015
  const pct       = ((threshold - 0.10) / 0.80) * 100

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className={clsx('text-xl font-black', textMain)}>{t.threshold.title}</h2>
        <p className={clsx('text-xs mt-0.5', textMuted)}>
          {t.threshold.sub}
        </p>
      </div>

      <div className="rounded-2xl"
        style={{
          background: isDark ? 'rgba(8,8,8,0.5)' : 'rgba(248,248,248,0.5)',
          border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
        }}>

        {/* Chart */}
        <div className="p-5 pb-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={CURVE_DATA} margin={{ top: 10, right: 20, bottom: 24, left: -4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

              <XAxis
                dataKey="threshold"
                type="number"
                scale="linear"
                domain={[0.10, 0.90]}
                ticks={X_TICKS}
                tickFormatter={v => v.toFixed(1)}
                tick={{ fill: tickFill, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{ value: t.threshold.thresholdLabel, position: 'insideBottom', offset: -12, fill: tickFill, fontSize: 11 }}
              />

              <YAxis
                domain={[0.4, 1.0]}
                ticks={[0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
                tickFormatter={v => v.toFixed(1)}
                tick={{ fill: tickFill, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <ReTooltip content={<PRTooltip />} />

              {/* Optimal threshold line */}
              <ReferenceLine
                x={OPTIMAL_THRESHOLD}
                stroke="#ffcc00"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{ value: t.threshold.optimal, position: 'insideTopLeft', fill: '#ffcc00', fontSize: 10, fontWeight: 700 }}
              />

              {/* Current threshold line (skip if same as optimal) */}
              {!isOptimal && (
                <ReferenceLine
                  x={threshold}
                  stroke={accent}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: t.threshold.selected, position: 'insideTopRight', fill: accent, fontSize: 10, fontWeight: 700 }}
                />
              )}

              <Line
                name={t.threshold.precision}
                dataKey="precision"
                stroke="#00e5ff"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#00e5ff', strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                name={t.threshold.recall}
                dataKey="recall"
                stroke="#ff0055"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#ff0055', strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                name={t.threshold.f1Score}
                dataKey="f1"
                stroke={accent}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 5, fill: accent, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Manual legend */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-1 mb-2">
            {[
              { name: t.threshold.precision, color: '#00e5ff', dash: false },
              { name: t.threshold.recall,    color: '#ff0055', dash: false },
              { name: t.threshold.f1Score,   color: accent,    dash: true  },
            ].map(l => (
              <div key={l.name} className="flex items-center gap-1.5 text-[0.65rem]">
                <svg width="24" height="4">
                  <line x1="0" y1="2" x2="24" y2="2"
                    stroke={l.color} strokeWidth="2.5"
                    strokeDasharray={l.dash ? '5 3' : 'none'} />
                </svg>
                <span className={textMuted}>{l.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={clsx('text-[0.65rem] font-semibold', textMuted)}>{t.threshold.classificationThreshold}</span>
            <span className="text-lg font-black" style={{ color: isOptimal ? '#ffcc00' : accent }}>
              {threshold.toFixed(2)}
              {isOptimal && (
                <span className="ml-1.5 text-[0.6rem] font-bold" style={{ color: '#ffcc00' }}>{t.threshold.optimalLabel}</span>
              )}
            </span>
          </div>

          {/* Track */}
          <div className="relative h-2 rounded-full select-none"
            style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            {/* Fill */}
            <div className="absolute left-0 top-0 h-full rounded-full pointer-events-none transition-all duration-75"
              style={{
                width: `${pct}%`,
                background: isOptimal ? '#ffcc00' : accent,
                boxShadow: `0 0 8px ${isOptimal ? '#ffcc00' : accent}55`,
              }} />
            {/* Optimal pip */}
            <div className="absolute top-0 h-full w-0.5 pointer-events-none"
              style={{
                left: `${((OPTIMAL_THRESHOLD - 0.10) / 0.80) * 100}%`,
                background: '#ffcc00',
                opacity: 0.7,
              }} />
            {/* Thumb */}
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 pointer-events-none transition-all duration-75"
              style={{
                left: `calc(${pct}% - 8px)`,
                background: isDark ? '#000' : '#fff',
                borderColor: isOptimal ? '#ffcc00' : accent,
                boxShadow: `0 0 10px ${isOptimal ? '#ffcc00' : accent}`,
              }} />
            {/* Range input (invisible, on top) */}
            <input
              type="range"
              min={0.10} max={0.90} step={0.01}
              value={threshold}
              onChange={e => setThreshold(Math.round(+e.target.value * 100) / 100)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ height: '100%' }}
            />
          </div>
        </div>

        {/* Current metric chips */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: t.threshold.precision, value: current?.precision.toFixed(3), color: '#00e5ff' },
              { label: t.threshold.recall,    value: current?.recall.toFixed(3),    color: '#ff0055' },
              { label: t.threshold.f1Score,   value: current?.f1.toFixed(3),        color: accent    },
              { label: t.threshold.optimalStar, value: OPTIMAL_THRESHOLD.toFixed(3),  color: '#ffcc00' },
            ].map(m => (
              <div key={m.label} className="text-center rounded-xl py-2.5"
                style={{ background: `${m.color}0a`, border: `1px solid ${m.color}20` }}>
                <div className="text-base font-black" style={{ color: m.color }}>{m.value}</div>
                <div className={clsx('text-[0.52rem] font-bold uppercase tracking-wider mt-0.5', textMuted)}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Callout */}
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.2)' }}>
            <Zap size={12} style={{ color: '#ffcc00', flexShrink: 0, marginTop: 1 }} />
            <p className={clsx('text-[0.6rem] leading-relaxed', textMuted)}>
              <span className="font-bold" style={{ color: '#ffcc00' }}>
                {t.threshold.optimalThreshold + ': ' + OPTIMAL_THRESHOLD}
              </span>{' '}
              — {t.threshold.callout}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
