/**
 * ROICalculator.jsx
 * Interactive cost-sensitive ROI calculator for churn prediction model.
 * Cost framework: El Attar & El-Hajj (Frontiers in AI, 2026).
 * TotalCost = FP × C_FP + FN × C_FN
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { DollarSign, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentAlpha } from '../lib/theme.js'
import { clsx } from 'clsx'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: 'easeOut' },
})

// ── Slider row ─────────────────────────────────
function SliderRow({ label, value, min, max, step = 1, format, onChange, color, isDark }) {
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={clsx('text-[0.65rem] font-semibold', textMuted)}>{label}</span>
        <span className="text-sm font-black" style={{ color }}>{format(value)}</span>
      </div>
      <div className="relative h-1.5 rounded-full"
        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}55` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 10 }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 pointer-events-none"
          style={{ left: `calc(${pct}% - 7px)`, background: '#000', borderColor: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  )
}

// ── Metric card ────────────────────────────────
function MetricCard({ label, value, sub, color, icon: Icon, isDark }) {
  return (
    <div className="rounded-xl p-4"
      style={{
        background: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.6)',
        border: `1px solid ${color}22`,
        boxShadow: `0 0 16px ${color}08`,
      }}>
      <div className="flex items-center justify-between mb-2">
        <span className={clsx('text-[0.55rem] font-bold uppercase tracking-widest', isDark ? 'text-white/35' : 'text-black/40')}>{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-xl font-black" style={{ color }}>{value}</div>
      {sub && <p className={clsx('text-[0.58rem] mt-0.5', isDark ? 'text-white/35' : 'text-black/40')}>{sub}</p>}
    </div>
  )
}

// ── Chart tooltip ──────────────────────────────
function ChartTooltip({ active, payload }) {
  const { isDark } = useTheme()
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(250,250,250,0.97)',
        border: `1px solid ${d.fill}44`,
      }}>
      <p className="font-bold" style={{ color: d.fill }}>{d.payload.name}</p>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.value)}
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────
export default function ROICalculator() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const accent = getAccent(isDark)
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const tickFill  = isDark ? '#555' : '#aaa'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'

  // ── Slider state ─────────────────────────────
  const [totalUsers,  setTotalUsers]  = useState(90000)
  const [churnRate,   setChurnRate]   = useState(25)
  const [arpu,        setArpu]        = useState(15)
  const [costRatio,   setCostRatio]   = useState(5)
  const [recall,      setRecall]      = useState(84)
  const [precision,   setPrecision]   = useState(84)

  // ── Calculations ──────────────────────────────
  const calc = useMemo(() => {
    const r = recall / 100
    const p = precision / 100
    const churningUsers    = totalUsers * (churnRate / 100)
    const revenueAtRisk    = churningUsers * arpu * 12
    const detectedByModel  = churningUsers * r
    const falseAlarms      = detectedByModel / p - detectedByModel
    const missedChurners   = churningUsers - detectedByModel
    const costMissed       = missedChurners * arpu * 12 * costRatio
    const costFalseAlarms  = falseAlarms * arpu // 1-month intervention cost per FP
    const netSavings       = revenueAtRisk * r * 0.38 - costFalseAlarms
    const roi              = costFalseAlarms > 0 ? netSavings / costFalseAlarms : 0
    const f1               = (2 * p * r) / (p + r)

    return {
      churningUsers:    Math.round(churningUsers),
      revenueAtRisk:    Math.round(revenueAtRisk),
      detectedByModel:  Math.round(detectedByModel),
      falseAlarms:      Math.round(falseAlarms),
      missedChurners:   Math.round(missedChurners),
      costMissed:       Math.round(costMissed),
      costFalseAlarms:  Math.round(costFalseAlarms),
      netSavings:       Math.round(netSavings),
      roi:              roi,
      f1:               f1,
      recovered:        Math.round(revenueAtRisk * r * 0.38),
      lost:             Math.round(revenueAtRisk * (1 - r * 0.38)),
    }
  }, [totalUsers, churnRate, arpu, costRatio, recall, precision])

  const fmt  = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
  const fmtN = v => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)

  const chartData = [
    { name: t.roi.revenueAtRiskChart,  value: calc.revenueAtRisk, fill: '#ff0055' },
    { name: t.roi.recoveredChart,       value: calc.recovered,     fill: accent },
    { name: t.roi.lostToChurn,          value: calc.lost,          fill: '#ff8800' },
  ]

  return (
    <motion.div {...fadeUp(0)}>
      {/* Header */}
      <div className="mb-5">
        <h2 className={clsx('text-xl font-black', textMain)}>{t.roi.title}</h2>
        <p className={clsx('text-xs mt-0.5', textMuted)}>
          {t.roi.formula}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Sliders */}
        <div className="rounded-2xl p-5 space-y-5"
          style={{
            background: isDark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)',
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
          }}>
          <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-1', textMuted)}>{t.roi.inputParams}</p>

          <SliderRow label={t.roi.totalUsers} value={totalUsers} min={10000} max={100000} step={1000}
            format={v => fmtN(v)} onChange={setTotalUsers} color={accent} isDark={isDark} />
          <SliderRow label={t.roi.churnRate} value={churnRate} min={5} max={40}
            format={v => `${v}%`} onChange={setChurnRate} color="#ff8800" isDark={isDark} />
          <SliderRow label={t.roi.avgRevenue} value={arpu} min={5} max={50}
            format={v => `$${v}`} onChange={setArpu} color="#00e5ff" isDark={isDark} />
          <SliderRow label={t.roi.costRatio} value={costRatio} min={2} max={10}
            format={v => `${v}:1`} onChange={setCostRatio} color="#ff0055" isDark={isDark} />
          <SliderRow label={t.roi.modelRecall} value={recall} min={50} max={99}
            format={v => `${v}%`} onChange={setRecall} color={accent} isDark={isDark} />
          <SliderRow label={t.roi.modelPrecision} value={precision} min={50} max={99}
            format={v => `${v}%`} onChange={setPrecision} color={accent} isDark={isDark} />

          {/* F1 display */}
          <div className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <span className={clsx('text-xs', textMuted)}>{t.roi.computedF1}</span>
            <span className="text-base font-black" style={{ color: accent }}>{calc.f1.toFixed(3)}</span>
          </div>
        </div>

        {/* Right: Outputs */}
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label={t.roi.revenueAtRisk}  value={fmt(calc.revenueAtRisk)} sub={`${fmtN(calc.churningUsers)} ${t.roi.churningUsers}`} color="#ff0055" icon={AlertTriangle} isDark={isDark} />
            <MetricCard label={t.roi.netSavings}      value={fmt(calc.netSavings)}    sub={t.roi.recoveryRate}   color={accent}    icon={TrendingUp}   isDark={isDark} />
            <MetricCard label={t.roi.falseAlarmCost} value={fmt(calc.costFalseAlarms)} sub={`${fmtN(calc.falseAlarms)} ${t.roi.fpInterventions}`} color="#ff8800" icon={DollarSign} isDark={isDark} />
            <MetricCard label={t.roi.roiLabel}              value={`${calc.roi.toFixed(1)}×`}  sub={t.roi.netSavingsFpCost} color="#00e5ff"  icon={Zap}          isDark={isDark} />
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl p-4"
            style={{
              background: isDark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
            }}>
            <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-3', textMuted)}>{t.roi.revenueBreakdown}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                <ReTooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.fill} style={{ filter: `drop-shadow(0 0 6px ${d.fill}44)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Source */}
          <p className={clsx('text-[0.52rem] italic', textMuted)}>
            {t.roi.roiSource}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
