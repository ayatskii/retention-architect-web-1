import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Activity, Shield, AlertTriangle, Brain,
  RefreshCw, Database, Zap, TrendingUp,
} from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { clsx } from 'clsx'

// ─── static cluster data ──────────────────────
// Healthy: high activity (8-14d), low payment attempts (1-3), large LTV
const HEALTHY = [
  {x:10,y:1,z:85},{x:12,y:2,z:90},{x:9,y:1,z:75},{x:13,y:1,z:95},
  {x:11,y:2,z:80},{x:14,y:1,z:100},{x:8,y:2,z:70},{x:12,y:1,z:88},
  {x:10,y:2,z:82},{x:13,y:2,z:92},{x:11,y:1,z:78},{x:9,y:3,z:68},
  {x:12,y:2,z:85},{x:14,y:2,z:97},{x:10,y:1,z:72},{x:11,y:3,z:79},
  {x:13,y:1,z:91},{x:8,y:1,z:65},{x:9,y:2,z:74},{x:12,y:3,z:83},
]

// Involuntary: moderate activity (6-12d), high payment attempts (5-9)
const INVOLUNTARY = [
  {x:9,y:6,z:50},{x:7,y:7,z:45},{x:11,y:8,z:55},{x:8,y:6,z:42},
  {x:10,y:7,z:58},{x:6,y:9,z:38},{x:9,y:8,z:48},{x:11,y:6,z:52},
  {x:7,y:7,z:44},{x:10,y:9,z:60},{x:8,y:6,z:40},{x:12,y:7,z:56},
  {x:6,y:8,z:35},{x:9,y:6,z:47},{x:11,y:9,z:61},{x:7,y:7,z:43},
]

// Voluntary: low activity (0-5d), low payment attempts (0-2), small LTV
const VOLUNTARY = [
  {x:2,y:1,z:20},{x:4,y:0,z:25},{x:1,y:2,z:15},{x:3,y:1,z:22},
  {x:5,y:0,z:30},{x:2,y:0,z:18},{x:4,y:1,z:28},{x:1,y:1,z:12},
  {x:3,y:2,z:24},{x:5,y:1,z:32},{x:2,y:0,z:16},{x:4,y:2,z:26},
  {x:0,y:0,z:10},{x:3,y:1,z:21},{x:5,y:2,z:29},
]

// ─── anomaly feed — ML feature-aware signals ──
const ANOMALIES = [
  { id:'A-001', msg:'User #0 — gen_failed rate 5.58% (threshold: 3%) · Involuntary churn imminent', severity:'critical', color:'#ff0055', ts:'2m ago' },
  { id:'A-002', msg:'User #3 — gen_completed 8.49% · Frustration index 0.72 · Critical voluntary churn risk', severity:'critical', color:'#ff0055', ts:'7m ago' },
  { id:'A-003', msg:'User #5 — gen_total dropped to 67 (avg: 198) · Sharp generation decline detected', severity:'high',    color:'#ff8800', ts:'19m ago' },
  { id:'A-004', msg:'User #4 — gen_completed 18.83% · At-risk cohort engagement dropping', severity:'warning',  color:'#ffcc00', ts:'31m ago' },
  { id:'A-005', msg:'Model drift on frustration feature — retraining queued (User #1 outlier: 13.49)', severity:'info',    color:'#00e5ff', ts:'1h ago' },
]

// ─── helpers ──────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: 'easeOut' },
})

// Custom neon dot for scatter
const NeonDot = (color) => (props) => {
  const { cx, cy, r } = props
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill={color} opacity={0.15} />
      <circle cx={cx} cy={cy} r={r} fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </g>
  )
}

// Custom scatter tooltip
function ScatterTooltip({ active, payload, d }) {
  const { isDark } = useTheme()
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  const pt = payload[0]?.payload
  const cluster = payload[0]?.name
  const clusterColors = { Healthy: '#ccff00', Involuntary: '#00e5ff', Voluntary: '#ff0055' }
  const color = clusterColors[cluster] || '#ccff00'
  return (
    <div className={clsx('rounded-xl px-4 py-3 text-xs shadow-2xl')}
      style={{
        background: isDark ? 'rgba(8,8,8,0.97)' : 'rgba(250,250,250,0.97)',
        border: `1px solid ${color}44`,
        boxShadow: `0 0 20px ${color}22`,
      }}>
      <p className="font-bold mb-1.5 tracking-widest text-[0.6rem] uppercase" style={{ color }}>{cluster}</p>
      <div className="space-y-0.5">
        <p className={clsx(isDark ? 'text-white/60' : 'text-black/60')}>
          {t.diagnostics.tooltipActivity} <span className="font-bold" style={{ color }}>{pt?.x}d</span>
        </p>
        <p className={clsx(isDark ? 'text-white/60' : 'text-black/60')}>
          {t.diagnostics.tooltipPayments} <span className="font-bold" style={{ color }}>{pt?.y}</span>
        </p>
        <p className={clsx(isDark ? 'text-white/60' : 'text-black/60')}>
          {t.diagnostics.tooltipLtv} <span className="font-bold" style={{ color }}>{pt?.z}</span>
        </p>
      </div>
    </div>
  )
}

// Card wrapper
function Card({ children, className = '', glowColor, style = {} }) {
  const { isDark } = useTheme()
  return (
    <div className={clsx(
      'rounded-2xl border backdrop-blur-xl transition-colors duration-300',
      isDark ? 'bg-[rgba(10,10,10,0.82)] border-white/[0.07]' : 'bg-white/82 border-black/[0.07]',
      className,
    )}
      style={{ boxShadow: glowColor ? `0 0 32px ${glowColor}10` : undefined, ...style }}>
      {children}
    </div>
  )
}

// Metric card
function MetricCard({ label, value, sub, color, icon: Icon, bar, delay }) {
  const { isDark } = useTheme()
  return (
    <motion.div {...fadeUp(delay)}>
      <Card glowColor={color}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={clsx('text-[0.58rem] font-bold tracking-[0.16em] uppercase',
              isDark ? 'text-white/35' : 'text-black/40')}>
              {label}
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
              <Icon size={15} style={{ color }} />
            </div>
          </div>
          <div className="text-3xl font-black leading-none mb-1"
            style={{ color, textShadow: `0 0 16px ${color}88` }}>
            {value}
          </div>
          <p className={clsx('text-[0.62rem]', isDark ? 'text-white/30' : 'text-black/35')}>{sub}</p>
          {bar !== undefined && (
            <div className="mt-3 h-1 rounded-full overflow-hidden"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar}%` }}
                transition={{ duration: 0.9, delay: delay + 0.2, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// ─── main component ────────────────────────────
export default function Diagnostics() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const d = t.diagnostics
  const textMuted = isDark ? 'text-white/35' : 'text-black/40'
  const textMain  = isDark ? 'text-white' : 'text-black'
  const tickFill  = isDark ? '#555' : '#aaa'

  const [retraining, setRetraining] = useState(false)
  const triggerRetrain = () => {
    setRetraining(true)
    setTimeout(() => setRetraining(false), 2800)
  }

  const metrics = [
    { label: d.f1Score,    value: '0.87', sub: '↑ +0.03 from last retrain', color: '#ccff00', icon: TrendingUp, bar: 87 },
    { label: d.precision,  value: '0.89', sub: 'True positive rate on test set', color: '#00e5ff', icon: Shield,   bar: 89 },
    { label: d.recall,     value: '0.85', sub: 'Sensitivity across all classes', color: '#ff8800', icon: Activity, bar: 85 },
    { label: d.confidence, value: '91%',  sub: 'Avg confidence on live cohort', color: '#ccff00', icon: Brain,    bar: 91 },
    { label: d.aucRoc,     value: '0.94', sub: 'Binary classification score',   color: '#8800ff', icon: Zap,      bar: 94 },
    { label: d.trainingSize, value: '284K', sub: d.trainingSizeVal,             color: '#00e5ff', icon: Database, bar: null },
  ]

  const clusterLegend = [
    { key: 'Healthy',     label: d.healthy,      color: '#ccff00', count: HEALTHY.length },
    { key: 'Involuntary', label: d.involuntary,  color: '#00e5ff', count: INVOLUNTARY.length },
    { key: 'Voluntary',   label: d.voluntary,    color: '#ff0055', count: VOLUNTARY.length },
  ]

  return (
    <div className="space-y-8 md:space-y-10">

      {/* ── Header ───────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={clsx('text-3xl md:text-4xl font-black', textMain)}>
            {d.title.split('').map((ch, i) => (
              <span key={i} style={i < 4 ? { color: '#ccff00', textShadow: '0 0 20px rgba(204,255,0,0.5)' } : {}}>
                {ch}
              </span>
            ))}
          </h1>
          <p className={clsx('text-sm mt-1', textMuted)}>{d.sub}</p>
        </div>

        <motion.button
          onClick={triggerRetrain}
          disabled={retraining}
          whileTap={{ scale: 0.96 }}
          className="btn-lime flex items-center gap-2 px-5 py-3 rounded-xl text-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} strokeWidth={2.5}
            className={retraining ? 'animate-spin' : ''} />
          {retraining ? 'Retraining…' : 'Trigger Retrain'}
        </motion.button>
      </motion.div>

      {/* ── Model Health ─────────────────────────────── */}
      <section>
        <motion.div {...fadeUp(0.05)} className="mb-4">
          <h2 className={clsx('text-xl font-black', textMain)}>{d.modelHealth}</h2>
          <p className={clsx('text-xs mt-0.5', textMuted)}>{d.modelHealthSub}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} delay={0.1 + i * 0.06} />
          ))}
        </div>

        {/* Last retrain strip */}
        <motion.div {...fadeUp(0.45)} className="mt-3">
          <Card>
            <div className="px-5 py-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: retraining ? '#ff8800' : '#ccff00',
                    boxShadow: `0 0 5px ${retraining ? '#ff8800' : '#ccff00'}` }} />
                <span className={clsx('text-xs font-semibold', textMain)}>
                  {retraining ? 'Retraining in progress…' : `${d.lastRetrain}: ${d.lastRetrainVal}`}
                </span>
              </div>
              {[
                ['Training samples', d.trainingSizeVal],
                ['Inference latency', '12ms p95'],
                ['Model version', 'v7.3.1'],
                ['Framework', 'XGBoost + NN'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className={clsx('text-[0.6rem]', textMuted)}>{k}:</span>
                  <span className="text-[0.6rem] font-bold" style={{ color: '#ccff00' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ── Scatter Plot ─────────────────────────────── */}
      <motion.section {...fadeUp(0.35)}>
        <Card glowColor="#ccff00">
          <div className="p-5 md:p-6 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className={clsx('text-xl font-black', textMain)}>{d.scatterTitle}</h2>
                <p className={clsx('text-xs mt-0.5', textMuted)}>{d.scatterSub}</p>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {clusterLegend.map(cl => (
                  <div key={cl.key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: cl.color, boxShadow: `0 0 6px ${cl.color}` }} />
                    <span className={clsx('text-xs', textMuted)}>{cl.label}</span>
                    <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ color: cl.color, background: `${cl.color}14` }}>
                      {cl.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: -8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis
                  dataKey="x" type="number" name={d.activityDays}
                  domain={[0, 15]} label={{
                    value: d.activityDays,
                    position: 'insideBottom', offset: -8,
                    fill: tickFill, fontSize: 11,
                  }}
                  tick={{ fill: tickFill, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  dataKey="y" type="number" name={d.paymentAttempts}
                  domain={[0, 11]} label={{
                    value: d.paymentAttempts,
                    angle: -90, position: 'insideLeft', offset: 12,
                    fill: tickFill, fontSize: 11,
                  }}
                  tick={{ fill: tickFill, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <ZAxis dataKey="z" range={[30, 200]} name={d.ltv} />
                <ReTooltip
                  content={<ScatterTooltip />}
                  cursor={{ strokeDasharray: '3 3', stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                />

                <Scatter
                  name="Healthy"
                  data={HEALTHY}
                  fill="#ccff00"
                  shape={NeonDot('#ccff00')}
                />
                <Scatter
                  name="Involuntary"
                  data={INVOLUNTARY}
                  fill="#00e5ff"
                  shape={NeonDot('#00e5ff')}
                />
                <Scatter
                  name="Voluntary"
                  data={VOLUNTARY}
                  fill="#ff0055"
                  shape={NeonDot('#ff0055')}
                />
              </ScatterChart>
            </ResponsiveContainer>

            {/* Cluster summary pills */}
            <div className="mt-4 flex flex-wrap gap-3">
              {clusterLegend.map(cl => (
                <div key={cl.key}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: `${cl.color}08`, border: `1px solid ${cl.color}20` }}>
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{ background: cl.color, boxShadow: `0 0 6px ${cl.color}` }} />
                  <span className={clsx('text-xs font-semibold', textMain)}>{cl.label}</span>
                  <span className="text-xs font-black" style={{ color: cl.color }}>
                    {cl.count} {d.usersInCluster}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ── Anomaly Feed ─────────────────────────────── */}
      <motion.section {...fadeUp(0.5)}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className={clsx('text-xl font-black', textMain)}>{d.anomalyFeed}</h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>{d.anomalyFeedSub}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.6rem] font-bold"
            style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid rgba(255,0,85,0.25)', color: '#ff0055' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff0055' }} />
            {ANOMALIES.length} signals
          </div>
        </div>

        <div className="space-y-2.5">
          {ANOMALIES.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.06 }}
            >
              <Card>
                <div className="px-4 py-3.5 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={clsx('text-[0.6rem] font-mono', textMuted)}>{a.id}</span>
                      <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest"
                        style={{ color: a.color, background: `${a.color}14` }}>
                        {a.severity}
                      </span>
                    </div>
                    <p className={clsx('text-sm font-semibold truncate', textMain)}>{a.msg}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={clsx('text-[0.6rem]', textMuted)}>{a.ts}</span>
                  </div>
                  <button className="btn-lime flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.62rem]">
                    <Zap size={10} strokeWidth={3} />
                    Investigate
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
