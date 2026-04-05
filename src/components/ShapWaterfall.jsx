/**
 * ShapWaterfall.jsx
 * Horizontal bar chart (layout="vertical") showing SHAP feature contributions.
 * Red bars = increase churn risk, green bars = reduce churn risk.
 * Labels are rendered with correct contrast colors on both themes.
 */
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ReferenceLine, Cell, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentAlpha } from '../lib/theme.js'
import { clsx } from 'clsx'

// ── Mock data ──────────────────────────────────
export const MOCK_SHAP = {
  baseValue: 0.35,
  outputValue: 0.87,
  features: [
    { name: 'gen_completed_rate',  value: 0.08,  contribution:  0.22 },
    { name: 'gen_failed_rate',     value: 0.056, contribution:  0.15 },
    { name: 'frustration_index',   value: 0.72,  contribution:  0.11 },
    { name: 'days_since_last_gen', value: 5,     contribution:  0.05 },
    { name: 'sub_weekday',         value: 2,     contribution:  0.03 },
    { name: 'gen_total',           value: 198,   contribution: -0.04 },
  ],
}

// ── Skeleton ────────────────────────────────────
function Skeleton({ isDark }) {
  const shimmer = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  return (
    <div className="space-y-3 py-2 animate-pulse">
      {[120, 95, 80, 65, 55, 45].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-36 h-3 rounded-full" style={{ background: shimmer }} />
          <div className="h-5 rounded-md" style={{ width: w, background: shimmer }} />
        </div>
      ))}
    </div>
  )
}

// ── Tooltip ─────────────────────────────────────
function ShapTooltip({ active, payload }) {
  const { isDark } = useTheme()
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const isPos = d?.contribution >= 0
  const color = isPos ? '#ff0055' : '#ccff00'
  return (
    <div className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(250,250,250,0.97)',
        border: `1px solid ${color}44`,
        minWidth: 190,
      }}>
      <p className="font-bold mb-1.5" style={{ color }}>{d?.name}</p>
      <div className="space-y-0.5">
        <p className={isDark ? 'text-white/60' : 'text-black/60'}>
          {t.shap.featureValue}: <span className="font-bold" style={{ color }}>{d?.value}</span>
        </p>
        <p className={isDark ? 'text-white/60' : 'text-black/60'}>
          {t.shap.shapContribution}:{' '}
          <span className="font-bold" style={{ color }}>
            {(d?.contribution ?? 0) >= 0 ? '+' : ''}{(d?.contribution ?? 0).toFixed(3)}
          </span>
        </p>
        <p className="text-[0.55rem] opacity-50 mt-1">
          {isPos ? t.shap.increasesTooltip : t.shap.reducesTooltip}
        </p>
      </div>
    </div>
  )
}

// ── Custom label rendered to the right of each bar ──
function BarLabel(props) {
  const { x, y, width, height, value } = props
  if (value === undefined || value === null) return null
  const isPos  = value >= 0
  const color  = isPos ? '#ff0055' : '#ccff00'
  const text   = (isPos ? '+' : '') + value.toFixed(3)
  const labelX = x + width + (width >= 0 ? 6 : -6)
  const anchor = width >= 0 ? 'start' : 'end'
  return (
    <text
      x={labelX}
      y={y + height / 2}
      dy="0.35em"
      fill={color}
      fontSize={10}
      fontWeight={700}
      textAnchor={anchor}
    >
      {text}
    </text>
  )
}

// ── Main component ──────────────────────────────
export default function ShapWaterfall({
  features    = null,
  baseValue   = null,
  outputValue = null,
  userId      = null,
}) {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const accent    = getAccent(isDark)
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const tickFill  = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'

  const isEmpty = !features || features.length === 0

  const src = {
    baseValue:   baseValue   ?? MOCK_SHAP.baseValue,
    outputValue: outputValue ?? MOCK_SHAP.outputValue,
    features:    features    ?? MOCK_SHAP.features,
  }

  // Sort by |contribution| desc, cap at 8
  const sorted = [...src.features]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 8)

  const domain = (() => {
    const vals = sorted.map(f => f.contribution)
    const mn   = Math.min(...vals, 0)
    const mx   = Math.max(...vals, 0)
    const pad  = (mx - mn) * 0.25 || 0.05
    return [+(mn - pad).toFixed(3), +(mx + pad).toFixed(3)]
  })()

  const chartHeight = sorted.length * 46 + 40

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className={clsx('text-sm font-black', textMain)}>{t.shap.title}</h3>
          <p className={clsx('text-[0.6rem] mt-0.5', textMuted)}>
            {userId != null ? `User #${userId} · ` : ''}
            {t.shap.base}: {src.baseValue.toFixed(3)} → {t.shap.prediction}: {src.outputValue.toFixed(3)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[0.58rem]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm" style={{ background: '#ff0055' }} />
            <span className={textMuted}>{t.shap.increasesRisk}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm" style={{ background: accent }} />
            <span className={textMuted}>{t.shap.reducesRisk}</span>
          </span>
        </div>
      </div>

      {isEmpty ? (
        <Skeleton isDark={isDark} />
      ) : (
        <>
          {/* Chart — extra right margin to give label text room */}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={sorted}
              margin={{ top: 4, right: 68, bottom: 4, left: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridColor} />

              <XAxis
                type="number"
                domain={domain}
                tick={{ fill: tickFill, fontSize: 10 }}
                tickFormatter={v => v.toFixed(2)}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={148}
                tick={{ fill: tickFill, fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />

              <ReferenceLine
                x={0}
                stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}
                strokeWidth={1.5}
              />

              <ReTooltip
                content={<ShapTooltip />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />

              <Bar
                dataKey="contribution"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
                label={<BarLabel />}
              >
                {sorted.map((f, i) => (
                  <Cell
                    key={i}
                    fill={f.contribution >= 0 ? '#ff0055' : accent}
                    style={{ filter: `drop-shadow(0 0 3px ${f.contribution >= 0 ? '#ff005533' : accentAlpha(isDark, 0.25)})` }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[0.62rem]"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
              }}>
              <span className={textMuted}>{t.shap.baseValue}</span>
              <span className="font-black" style={{ color: '#00e5ff' }}>{src.baseValue.toFixed(3)}</span>
            </div>
            <span className="text-[0.6rem]" style={{ color: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)' }}>→</span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[0.62rem]"
              style={{ background: 'rgba(255,0,85,0.06)', border: '1px solid rgba(255,0,85,0.2)' }}>
              <span className={textMuted}>{t.shap.modelOutput}</span>
              <span className="font-black" style={{ color: '#ff0055' }}>{src.outputValue.toFixed(3)}</span>
            </div>
            <p className={clsx('text-[0.55rem] ml-auto italic', textMuted)}>
              {t.shap.source}
            </p>
          </div>
        </>
      )}
    </motion.div>
  )
}
