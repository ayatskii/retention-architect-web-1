/**
 * RiskSegmentation.jsx
 * 3-cluster risk overview: High / Medium / Low risk cohorts.
 * Based on Autoencoder + K-Means segmentation (Frontiers in AI, 2026).
 * Accepts { clusters } prop or uses MOCK_CLUSTERS.
 */
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { AlertTriangle, Activity, CheckCircle2, Users, Clock, DollarSign } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { clsx } from 'clsx'

// ── Mock data ──────────────────────────────────
export const MOCK_CLUSTERS = [
  { name: 'High-Risk',   churnRate: 42, users: 2478, avgTenure: '3.2 days',  avgSpend: '$14.99', color: '#ff0055', icon: AlertTriangle, dominantType: 'Voluntary' },
  { name: 'Medium-Risk', churnRate: 21, users: 2586, avgTenure: '8.1 days',  avgSpend: '$14.99', color: '#ff8800', icon: Activity,      dominantType: 'Mixed'     },
  { name: 'Low-Risk',    churnRate: 15, users: 1979, avgTenure: '13.4 days', avgSpend: '$29.99', color: '#ccff00', icon: CheckCircle2,  dominantType: 'Involuntary' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: 'easeOut' },
})

// ── Cluster card ───────────────────────────────
// Cluster names and dominant-churn-type strings are dynamic data served by
// /segments — rendered verbatim without client-side i18n translation.
function ClusterCard({ cluster, delay, isDark, t }) {
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const Icon = cluster.icon

  return (
    <motion.div {...fadeUp(delay)}>
      <div className="rounded-2xl p-5 h-full transition-all duration-200 hover:scale-[1.01]"
        style={{
          background: isDark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)',
          border: `1px solid ${cluster.color}28`,
          boxShadow: `0 0 24px ${cluster.color}0d`,
          borderTop: `2px solid ${cluster.color}`,
        }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${cluster.color}14`, border: `1px solid ${cluster.color}28` }}>
            <Icon size={18} style={{ color: cluster.color }} />
          </div>
          <div className="text-right">
            <div className="text-3xl font-black leading-none" style={{ color: cluster.color }}>
              {cluster.churnRate}%
            </div>
            <div className={clsx('text-[0.58rem] font-bold tracking-widest uppercase mt-0.5', textMuted)}>
              {t.segments.churnRate}
            </div>
          </div>
        </div>

        {/* Name */}
        <h3 className={clsx('text-base font-black mb-3', textMain)}>{cluster.name}</h3>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: Users,       label: t.segments.usersLabel, value: cluster.users.toLocaleString() },
            { icon: Clock,       label: t.segments.tenure,     value: cluster.avgTenure },
            { icon: DollarSign,  label: t.segments.arpu,       value: cluster.avgSpend },
          ].map(({ icon: StatIcon, label, value }) => (
            <div key={label} className="text-center rounded-xl py-2"
              style={{ background: `${cluster.color}0a`, border: `1px solid ${cluster.color}18` }}>
              <StatIcon size={11} style={{ color: cluster.color, margin: '0 auto 3px' }} />
              <div className="text-[0.7rem] font-black" style={{ color: cluster.color }}>{value}</div>
              <div className={clsx('text-[0.5rem] uppercase tracking-widest', textMuted)}>{label}</div>
            </div>
          ))}
        </div>

        {/* Dominant churn type badge */}
        <div className="flex items-center gap-1.5">
          <span className={clsx('text-[0.55rem] font-semibold', textMuted)}>{t.segments.dominantChurn}</span>
          <span className="text-[0.55rem] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${cluster.color}14`, color: cluster.color }}>
            {cluster.dominantType}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Stacked distribution tooltip ───────────────
function DistTooltip({ active, payload }) {
  const { isDark } = useTheme()
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: isDark ? 'rgba(6,6,6,0.95)' : 'rgba(250,250,250,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            {p.name}: <span className="font-bold" style={{ color: p.fill }}>{p.value.toFixed(1)}%</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────
export default function RiskSegmentation({ clusters = null }) {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const data = clusters ?? MOCK_CLUSTERS
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'

  // Distribution bar data (single bar, stacked)
  const total = data.reduce((s, c) => s + c.users, 0)
  const distData = [
    data.reduce((obj, c) => ({ ...obj, [c.name]: +((c.users / total) * 100).toFixed(1) }), { name: 'Distribution' }),
  ]

  return (
    <div>
      {/* Section header */}
      <motion.div {...fadeUp(0)} className="mb-5">
        <h2 className={clsx('text-xl font-black', textMain)}>{t.segments.riskSegTitle}</h2>
        <p className={clsx('text-xs mt-0.5', textMuted)}>
          {t.segments.autoencoder + ' · ' + total.toLocaleString() + ' ' + t.segments.riskSegSub}
        </p>
      </motion.div>

      {/* 3 cluster cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {data.map((cluster, i) => (
          <ClusterCard key={cluster.name} cluster={cluster} delay={0.08 + i * 0.09} isDark={isDark} t={t} />
        ))}
      </div>

      {/* Distribution bar */}
      <motion.div {...fadeUp(0.32)}>
        <div className="rounded-2xl px-5 py-4"
          style={{
            background: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.6)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          }}>
          <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-3', textMuted)}>
            {t.segments.distribution}
          </p>
          <ResponsiveContainer width="100%" height={40}>
            <BarChart layout="vertical" data={distData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" hide />
              <ReTooltip content={<DistTooltip />} cursor={false} />
              {data.map((c) => (
                <Bar key={c.name} dataKey={c.name} stackId="dist" radius={0} maxBarSize={28}>
                  <Cell fill={c.color} style={{ filter: `drop-shadow(0 0 4px ${c.color}44)` }} />
                  <LabelList
                    dataKey={c.name}
                    position="insideLeft"
                    formatter={v => v > 8 ? `${c.name.split(/[-\s]/)[0]} ${v.toFixed(0)}%` : ''}
                    style={{ fill: c.name === 'Low-Risk' ? '#000' : '#fff', fontSize: 10, fontWeight: 700 }}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-2.5">
            {data.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-[0.58rem]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                <span className={textMuted}>{c.name}</span>
                <span className="font-bold" style={{ color: c.color }}>
                  {((c.users / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
            <span className={clsx('ml-auto text-[0.5rem] italic', textMuted)}>
              {t.segments.source}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
