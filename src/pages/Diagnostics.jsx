import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts'
import {
  Activity, Shield, AlertTriangle, Brain,
  RefreshCw, Database, Zap, TrendingUp, Search,
} from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentAlpha } from '../lib/theme'
import { fetchClusters, fetchShap, fetchModelMetrics, fetchAnomalies } from '../services/api'
import { clsx } from 'clsx'
import ShapWaterfall from '../components/ShapWaterfall'

// ─── cluster colors ───────────────────────────
const CLUSTER_COLORS = {
  Healthy:   '#ccff00',
  Technical: '#ffcc00',
  Voluntary: '#ff0055',
}

// ─── helpers ──────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: 'easeOut' },
})

// Jitter multiplier per period (simulates time-range variation client-side)
const PERIOD_JITTER = { '7d': 0.72, '30d': 1.0, '90d': 1.18 }

function applyJitter(points, period) {
  const factor = PERIOD_JITTER[period] ?? 1.0
  if (factor === 1.0) return points
  return points.map(p => ({
    ...p,
    x: p.anchor ? p.x : Math.max(0, +(p.x * factor + (Math.random() - 0.5) * 12).toFixed(1)),
    y: p.anchor ? p.y : +(p.y * factor + (Math.random() - 0.5) * 0.5).toFixed(4),
  }))
}

// Custom neon dot shape factory
const NeonDot = (color, isAnchor = false) => (props) => {
  const { cx, cy } = props
  const r = isAnchor ? 7 : 5
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill={color} opacity={0.12} />
      {isAnchor && <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} />}
      <circle cx={cx} cy={cy} r={r} fill={color}
        style={{ filter: `drop-shadow(0 0 ${isAnchor ? 8 : 5}px ${color})` }} />
    </g>
  )
}

// Scatter tooltip
function ScatterTooltip({ active, payload }) {
  const { isDark } = useTheme()
  const { t } = useI18n()
  const d = t.diagnostics
  if (!active || !payload?.length) return null
  const pt = payload[0]?.payload
  const clusterName = pt?.cluster ?? payload[0]?.name ?? 'Unknown'
  const color = CLUSTER_COLORS[clusterName] || '#ccff00'
  return (
    <div className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        background: isDark ? 'rgba(8,8,8,0.97)' : 'rgba(250,250,250,0.97)',
        border: `1px solid ${color}44`,
        boxShadow: `0 0 20px ${color}22`,
        minWidth: 180,
      }}>
      <p className="font-bold mb-1.5 tracking-widest text-[0.6rem] uppercase" style={{ color }}>
        {clusterName}
        {pt?.anchor && <span className="ml-2 opacity-60">· anchor</span>}
      </p>
      {pt?.anchor && pt?.user_id != null && (
        <p className="font-bold text-[0.7rem] mb-1" style={{ color }}>
          User #{pt.user_id}
        </p>
      )}
      <div className="space-y-0.5">
        <p className={isDark ? 'text-white/60' : 'text-black/60'}>
          {d.totalActivityShort}: <span className="font-bold" style={{ color }}>{Math.round(pt?.x)}</span>
        </p>
        <p className={isDark ? 'text-white/60' : 'text-black/60'}>
          {d.frustrationIndex}: <span className="font-bold" style={{ color }}>{(+pt?.y).toFixed(2)}</span>
        </p>
        {pt?.risk_score != null && (
          <p className={isDark ? 'text-white/60' : 'text-black/60'}>
            {d.riskScore}: <span className="font-bold" style={{ color }}>{(pt.risk_score * 100).toFixed(0)}%</span>
          </p>
        )}
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
          {bar !== undefined && bar !== null && (
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
  const accent    = getAccent(isDark)
  const d = t.diagnostics
  const [rawAnomalies, setRawAnomalies] = useState([])
  useEffect(() => {
    fetchAnomalies().then(data => setRawAnomalies(data.anomalies ?? [])).catch(() => {})
  }, [])
  // Message strings come directly from the backend (no i18n lookup for
  // dynamic alert text). Only the relative-time suffix ("m ago" / "h ago")
  // is translated because it's UI chrome, not data.
  const ANOMALIES = rawAnomalies.map(a => ({
    id:       a.id,
    severity: a.severity,
    color:    a.color,
    msg:      a.message ?? '',
    ts:       (a.ts_num ?? '') + (a.ts_unit === 'h' ? d.hAgo : d.mAgo),
  }))
  const textMuted = isDark ? 'text-white/35' : 'text-black/40'
  const textMain  = isDark ? 'text-white' : 'text-black'
  const tickFill  = isDark ? '#555' : '#aaa'

  const [retraining, setRetraining] = useState(false)
  const [period, setPeriod] = useState('30d')
  const [allPoints, setAllPoints] = useState([])
  const [loading, setLoading] = useState(true)

  // SHAP deep dive state
  const [shapQuery, setShapQuery]     = useState('')
  const [shapData, setShapData]       = useState(null)
  const [shapLoading, setShapLoading] = useState(false)
  const [shapError, setShapError]     = useState(null)

  const runShapQuery = async (uid) => {
    const id = (uid ?? shapQuery).trim()
    if (!id) return
    setShapLoading(true); setShapError(null); setShapData(null)
    const data = await fetchShap(id)
    if (!data) setShapError(`${d.noMlRecord} "${id}". ${d.availableIds}`)
    else setShapData(data)
    setShapLoading(false)
  }

  // Fetch clusters from backend
  const loadClusters = useCallback(async (p) => {
    setLoading(true)
    const data = await fetchClusters(p)
    const jittered = applyJitter(data.points ?? [], p)
    setAllPoints(jittered)
    setTimeout(() => setLoading(false), 500) // minimum spinner time for UX
  }, [])

  useEffect(() => { loadClusters(period) }, [period, loadClusters])

  const handlePeriod = (p) => {
    if (p === period) return
    setPeriod(p)
  }

  // Split into cluster groups for 3 Scatter components
  const byCluster = (name) => allPoints.filter(p => p.cluster === name)
  const healthyPts   = byCluster('Healthy')
  const voluntaryPts = byCluster('Voluntary')
  const technicalPts = byCluster('Technical')

  const clusterLegend = [
    { key: 'Healthy',   label: d.lowRiskHealthy,                color: CLUSTER_COLORS.Healthy,   pts: healthyPts },
    { key: 'Technical', label: d.techChurnRisk,                 color: CLUSTER_COLORS.Technical, pts: technicalPts },
    { key: 'Voluntary', label: d.volChurnRisk,                  color: CLUSTER_COLORS.Voluntary, pts: voluntaryPts },
  ]

  const triggerRetrain = () => {
    setRetraining(true)
    setTimeout(() => setRetraining(false), 2800)
  }

  // Model performance metrics from /model/metrics (with fallback display values).
  const [modelMetrics, setModelMetrics] = useState(null)
  useEffect(() => {
    fetchModelMetrics().then(m => { if (m) setModelMetrics(m) }).catch(() => {})
  }, [])
  const fmtPct  = (v, digits = 2) => v == null ? '—' : v.toFixed(digits)
  const fmtPctN = (v)              => v == null ? '—' : Math.round(v * 100) + '%'
  const fmtK    = (n)              => {
    if (n == null) return '—'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return Math.round(n / 1_000) + 'K'
    return String(n)
  }
  const mm = modelMetrics
  const metrics = [
    { label: d.f1Score,      value: fmtPct(mm?.f1_score),                  sub: d.f1Sub,          color: '#ccff00', icon: TrendingUp, bar: mm?.f1_score   != null ? Math.round(mm.f1_score   * 100) : null },
    { label: d.precision,    value: fmtPct(mm?.precision),                 sub: d.precisionSub,   color: '#00e5ff', icon: Shield,     bar: mm?.precision  != null ? Math.round(mm.precision  * 100) : null },
    { label: d.recall,       value: fmtPct(mm?.recall),                    sub: d.recallSub,      color: '#ff8800', icon: Activity,   bar: mm?.recall     != null ? Math.round(mm.recall     * 100) : null },
    { label: d.confidence,   value: fmtPctN(mm?.accuracy),                 sub: d.confidenceSub,  color: '#ccff00', icon: Brain,      bar: mm?.accuracy   != null ? Math.round(mm.accuracy   * 100) : null },
    { label: d.aucRoc,       value: fmtPct(mm?.auc_roc),                   sub: d.aucRocSub,      color: '#8800ff', icon: Zap,        bar: mm?.auc_roc    != null ? Math.round(mm.auc_roc    * 100) : null },
    { label: d.trainingSize, value: fmtK((mm?.training_samples ?? 0) + (mm?.test_samples ?? 0)), sub: d.trainingSizeVal, color: '#00e5ff', icon: Database, bar: null },
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
          <RefreshCw size={14} strokeWidth={2.5} className={retraining ? 'animate-spin' : ''} />
          {retraining ? d.retraining : d.triggerRetrain}
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
                  {retraining ? d.retrainingInProgress : `${d.lastRetrain}: ${d.lastRetrainVal}`}
                </span>
              </div>
              {[
                [d.trainingSamples, d.trainingSizeVal],
                [d.inferenceLatency, '12ms p95'],
                [d.modelVersion, 'v7.3.1'],
                [d.framework, 'XGBoost + NN'],
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className={clsx('text-xl font-black', textMain)}>{d.clusterMapTitle}</h2>
                <p className={clsx('text-xs mt-0.5', textMuted)}>
                  {d.clusterMapSub}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Period filters */}
                {['7d', '30d', '90d'].map(p => (
                  <button
                    key={p}
                    onClick={() => handlePeriod(p)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-[0.68rem] font-bold uppercase tracking-wider transition-all duration-200',
                      period === p
                        ? 'text-black'
                        : isDark ? 'text-white/40 hover:text-white/70' : 'text-black/40 hover:text-black/70',
                    )}
                    style={period === p
                      ? { background: '#ccff00', boxShadow: '0 0 12px rgba(204,255,0,0.4)' }
                      : { background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {clusterLegend.map(cl => (
                <div key={cl.key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: cl.color, boxShadow: `0 0 6px ${cl.color}` }} />
                  <span className={clsx('text-xs', textMuted)}>{cl.label}</span>
                  <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ color: cl.color, background: `${cl.color}14` }}>
                    {cl.pts.length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 md:p-6 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-b-2xl z-10"
                style={{ background: isDark ? 'rgba(10,10,10,0.7)' : 'rgba(255,255,255,0.7)' }}>
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={22} className="animate-spin" style={{ color: '#ccff00' }} />
                  <span className={clsx('text-xs font-semibold', textMuted)}>{d.loadingClusters}</span>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis
                  dataKey="x" type="number" name={d.totalActivityShort}
                  domain={[0, 220]}
                  label={{
                    value: d.totalActivity,
                    position: 'insideBottom', offset: -20,
                    fill: tickFill, fontSize: 11,
                  }}
                  tick={{ fill: tickFill, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  dataKey="y" type="number" name={d.frustrationIndex}
                  label={{
                    value: d.frustrationIndex,
                    angle: -90, position: 'insideLeft', offset: 16,
                    fill: tickFill, fontSize: 11,
                  }}
                  tick={{ fill: tickFill, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <ReTooltip
                  content={<ScatterTooltip />}
                  cursor={{ strokeDasharray: '3 3', stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                />

                {/* Synthetic points (non-anchor) */}
                <Scatter
                  name="Healthy"
                  data={healthyPts.filter(p => !p.anchor)}
                  fill={CLUSTER_COLORS.Healthy}
                  shape={NeonDot(CLUSTER_COLORS.Healthy, false)}
                />
                <Scatter
                  name="Technical"
                  data={technicalPts.filter(p => !p.anchor)}
                  fill={CLUSTER_COLORS.Technical}
                  shape={NeonDot(CLUSTER_COLORS.Technical, false)}
                />
                <Scatter
                  name="Voluntary"
                  data={voluntaryPts.filter(p => !p.anchor)}
                  fill={CLUSTER_COLORS.Voluntary}
                  shape={NeonDot(CLUSTER_COLORS.Voluntary, false)}
                />

                {/* Anchor points (demo users) — rendered larger on top */}
                <Scatter
                  name="Healthy"
                  data={healthyPts.filter(p => p.anchor)}
                  fill={CLUSTER_COLORS.Healthy}
                  shape={NeonDot(CLUSTER_COLORS.Healthy, true)}
                />
                <Scatter
                  name="Technical"
                  data={technicalPts.filter(p => p.anchor)}
                  fill={CLUSTER_COLORS.Technical}
                  shape={NeonDot(CLUSTER_COLORS.Technical, true)}
                />
                <Scatter
                  name="Voluntary"
                  data={voluntaryPts.filter(p => p.anchor)}
                  fill={CLUSTER_COLORS.Voluntary}
                  shape={NeonDot(CLUSTER_COLORS.Voluntary, true)}
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
                    {cl.pts.length} {d.users}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[0.6rem] font-bold"
                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
                <span className={textMuted}>{d.anchorNote}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ── SHAP Deep Dive ───────────────────────────── */}
      <motion.section {...fadeUp(0.42)}>
        <Card glowColor="#ccff00">
          <div className="p-5 md:p-6 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <h2 className={clsx('text-xl font-black', textMain)}>{d.shapTitle}</h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>
              {d.shapSub}
            </p>
          </div>

          <div className="p-5 md:p-6">
            {/* Input row */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shapQuery}
                onChange={e => setShapQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runShapQuery()}
                placeholder={d.shapPlaceholder}
                className={clsx(
                  'flex-1 rounded-xl px-4 py-2.5 text-sm outline-none border transition-all',
                  isDark
                    ? 'bg-white/[0.04] text-white placeholder-white/25 border-white/[0.08] focus:border-white/25'
                    : 'bg-black/[0.04] text-black placeholder-black/30 border-black/[0.08] focus:border-black/25',
                )}
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => runShapQuery()}
                disabled={!shapQuery.trim() || shapLoading}
                className="btn-lime flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
              >
                <Search size={14} strokeWidth={2.5} />
                {shapLoading ? d.loading : d.explain}
              </motion.button>
            </div>

            {/* Quick ID pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['0','1','3','4','5'].map(id => (
                <button key={id}
                  onClick={() => { setShapQuery(id); runShapQuery(id) }}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: accentAlpha(isDark, 0.1), border: `1px solid ${accentAlpha(isDark, 0.25)}`, color: accent }}>
                  User #{id}
                </button>
              ))}
              <span className={clsx('text-[0.6rem] self-center', textMuted)}>{d.clickToExplain}</span>
            </div>

            {/* Error */}
            {shapError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-xs"
                style={{ background: 'rgba(255,0,85,0.07)', border: '1px solid rgba(255,0,85,0.2)', color: '#ff0055' }}>
                {shapError}
              </div>
            )}

            {/* SHAP waterfall */}
            {(shapData || (!shapData && !shapError && !shapLoading)) && (
              <ShapWaterfall
                features={shapData?.features ?? null}
                baseValue={shapData?.base_value ?? null}
                outputValue={shapData?.output_value ?? null}
                userId={shapData?.user_id ?? null}
              />
            )}
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
            {ANOMALIES.length} {d.signals}
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
                    {d.investigate}
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
