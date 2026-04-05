import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown, TrendingUp, Users, CheckCircle2, Clock3,
  Eye, AlertTriangle, Zap, Search, XCircle, CreditCard,
  Activity, Shield, Check, ArrowRight, FileDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { fetchStats, fetchPredict, fetchChurnDrivers, fetchTechFailures } from '../services/api'
import { exportTaskPdf } from '../lib/exportTaskPdf'
import { clsx } from 'clsx'

// ─── helpers ──────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: 'easeOut' },
})

// ─── derive scan factors from real ML metrics ──
function buildFactors(metrics = {}, riskScore = 50) {
  const sev = riskScore >= 75 ? 'critical' : riskScore >= 45 ? 'warning' : 'healthy'
  return [
    {
      icon: CreditCard,
      labelKey: 'Technical Error Rate',
      detail: `gen_failed: ${((metrics.gen_failed ?? 0) * 100).toFixed(2)}% — ${
        (metrics.gen_failed ?? 0) > 0.03
          ? 'Elevated failure rate — primary churn driver'
          : 'Within acceptable bounds'
      }`,
      severity: (metrics.gen_failed ?? 0) > 0.03 ? 'critical' : sev,
    },
    {
      icon: AlertTriangle,
      labelKey: 'User Frustration Index',
      detail: `Score: ${(metrics.frustration ?? 0).toFixed(4)} — ${
        Math.abs(metrics.frustration ?? 0) < 0.3
          ? 'Low frustration signal'
          : Math.abs(metrics.frustration ?? 0) > 5
            ? 'High engagement detected (positive signal)'
            : 'Moderate frustration — monitor closely'
      }`,
      severity: Math.abs(metrics.frustration ?? 0) > 0.5 && Math.abs(metrics.frustration ?? 0) < 5 ? sev : 'healthy',
    },
    {
      icon: Activity,
      labelKey: 'Total Output Units',
      detail: `${metrics.gen_total ?? 0} total generations · Completion rate: ${(
        (metrics.gen_completed ?? 0) * 100
      ).toFixed(1)}% — ${
        (metrics.gen_completed ?? 0) < 0.2
          ? 'Critical drop in output completion'
          : (metrics.gen_completed ?? 0) < 0.5
            ? 'Below expected engagement threshold'
            : 'Healthy completion rate'
      }`,
      severity: (metrics.gen_completed ?? 0) < 0.2 ? 'critical'
              : (metrics.gen_completed ?? 0) < 0.5 ? 'warning'
              : 'healthy',
    },
  ]
}

const sevCfg = {
  critical: { color: '#ff0055', bg: 'rgba(255,0,85,0.08)',   border: 'rgba(255,0,85,0.22)'   },
  warning:  { color: '#ff8800', bg: 'rgba(255,136,0,0.08)', border: 'rgba(255,136,0,0.22)'  },
  healthy:  { color: '#ccff00', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.22)'  },
}


// ─── sub-components ────────────────────────────
function Card({ children, className = '', glowColor, style = {} }) {
  const { isDark } = useTheme()
  return (
    <div
      className={clsx(
        'rounded-2xl backdrop-blur-xl transition-colors duration-300',
        isDark ? 'bg-[rgba(10,10,10,0.8)] border border-white/[0.07]' : 'bg-white/80 border border-black/[0.07]',
        className,
      )}
      style={{
        boxShadow: glowColor ? `0 0 32px ${glowColor}14` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function BarTooltip({ active, payload, label }) {
  const { isDark } = useTheme()
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  const color = payload[0].payload.color
  return (
    <div className={clsx('rounded-xl p-3 text-sm', isDark ? 'bg-[#111]' : 'bg-white')}
      style={{ border: `1px solid ${color}44`, boxShadow: `0 0 16px ${color}22` }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color }}>{label}</p>
      <p className="text-lg font-black" style={{ color }}>
        {payload[0].value}
        <span className={clsx('text-xs font-normal ml-1', isDark ? 'text-white/40' : 'text-black/40')}>
          {t.common.riskScore}
        </span>
      </p>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  const { isDark } = useTheme()
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  const e = payload[0].payload
  const total = e.total || 1
  return (
    <div className={clsx('rounded-xl p-3', isDark ? 'bg-[#111]' : 'bg-white')}
      style={{ border: `1px solid ${e.color}44` }}>
      <p className="text-xs font-bold tracking-widest uppercase" style={{ color: e.color }}>{e.name}</p>
      <p className={clsx('text-xl font-black', isDark ? 'text-white' : 'text-black')}>{e.value.toLocaleString()}</p>
      <p className={clsx('text-xs', isDark ? 'text-white/30' : 'text-black/40')}>
        {((e.value / total) * 100).toFixed(1)}% {t.common.ofFailuresShort}
      </p>
    </div>
  )
}

function CustomBar(props) {
  const { x, y, width, height, color } = props
  const id = `gb-${color?.replace('#', '') ?? 'default'}`
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.25} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#${id})`} rx={6}
        style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
    </g>
  )
}

// ─── main component ────────────────────────────
export default function Overview({ onNavigate }) {
  const { t } = useI18n()
  const { isDark } = useTheme()

  // Live stats from backend (with fallback to hardcoded values)
  const [stats, setStats] = useState({
    total_revenue_at_risk: 3_200_000,
    recoverable_assets: 1_200_000,
    total_churned_users: 22_500,
    engine_health_pct: 99.98,
  })
  const [rawBars, setRawBars]     = useState([])
  const [rawSlices, setRawSlices] = useState([])
  const [pieTotal, setPieTotal]   = useState(0)
  useEffect(() => {
    fetchStats().then(data => setStats(data)).catch(() => {})
    fetchChurnDrivers().then(data => setRawBars(data.drivers ?? [])).catch(() => {})
    fetchTechFailures().then(data => {
      setRawSlices(data.slices ?? [])
      setPieTotal(data.total ?? 0)
    }).catch(() => {})
  }, [])

  // Labels now come from the backend verbatim — no client-side i18n mapping
  // for dynamic data (per explicit design choice). Static chrome (headings,
  // axis titles, etc.) still uses t.* translations below.
  const barData = rawBars.map(b => ({
    segment: b.label ?? b.key,
    days:    b.score,
    color:   b.color,
  }))
  const PIE_DATA = rawSlices.map(s => ({
    key:   s.key,
    name:  s.label ?? s.key,
    value: s.count,
    color: s.color,
    total: pieTotal,
  }))

  // PM tasks state
  const [tasks, setTasks] = useState([
    { id: 1, done: false, exporting: false, exported: false },
    { id: 2, done: false, exporting: false, exported: false },
    { id: 3, done: false, exporting: false, exported: false },
  ])
  const markDone = (id) => setTasks(ts => ts.map(tk => tk.id === id ? { ...tk, done: !tk.done } : tk))
  const exportPdf = useCallback(async (id) => {
    setTasks(ts => ts.map(tk => tk.id === id ? { ...tk, exporting: true } : tk))
    try {
      await exportTaskPdf(id, t)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
    setTasks(ts => ts.map(tk => tk.id === id ? { ...tk, exporting: false, exported: true } : tk))
    setTimeout(() => setTasks(ts => ts.map(tk => tk.id === id ? { ...tk, exported: false } : tk)), 2800)
  }, [t])

  // Deep Scan state
  const [query, setQuery] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [outreachSent, setOutreachSent] = useState(false)
  const [discountSent, setDiscountSent] = useState(false)
  const [actionToast, setActionToast] = useState({ show: false, msg: '' })

  // Reset action buttons when scan result changes
  useEffect(() => {
    setOutreachSent(false)
    setDiscountSent(false)
  }, [scanResult])

  function sendAction(type) {
    if (type === 'outreach') {
      setOutreachSent(true)
      setActionToast({ show: true, msg: t.common.outreachTriggered })
    } else {
      setDiscountSent(true)
      setActionToast({ show: true, msg: t.common.discountDispatched })
    }
    setTimeout(() => setActionToast(t => ({ ...t, show: false })), 3000)
  }

  const runScan = async () => {
    if (!query.trim()) return
    setScanning(true); setScanResult(null); setScanError(null)
    try {
      const apiResult = await fetchPredict(query.trim())
      if (!apiResult) {
        setScanError(`${t.scan.notFound} "${query}" — ${t.scan.tryIds}`)
        setScanning(false)
        return
      }
      const score = apiResult.churn_score ?? Math.round((apiResult.risk_score ?? 0) * 100)
      const level = apiResult.risk_level ?? 'MODERATE'
      const riskColor = level === 'CRITICAL' ? '#ff0055'
        : level === 'HIGH'     ? '#ff4400'
        : level === 'HEALTHY'  ? '#ccff00'
        : '#ff8800'
      setScanResult({
        id:        apiResult.user_id,
        name:      `User #${apiResult.user_id}`,
        plan:      apiResult.churn_type ?? apiResult.risk_type ?? '—',
        lastActive: '—',
        riskScore:  score,
        riskLevel:  level,
        riskColor,
        churnType:  (apiResult.churn_type ?? apiResult.risk_type ?? 'unknown').toLowerCase(),
        factors:    buildFactors(apiResult.metrics ?? {}, score),
        rec:        apiResult.summary ?? apiResult.recommendation ?? '',
        metrics:    apiResult.metrics ?? {},
      })
    } catch {
      setScanError(`${t.scan.notFound} "${query}"`)
    }
    setScanning(false)
  }

  const taskDefs = [
    { key: 1, title: t.tasks.task1Title, sub: t.tasks.task1Sub, tag: t.tasks.task1Tag, tagColor: '#ff0055', icon: CreditCard },
    { key: 2, title: t.tasks.task2Title, sub: t.tasks.task2Sub, tag: t.tasks.task2Tag, tagColor: '#ff8800', icon: Eye },
    { key: 3, title: t.tasks.task3Title, sub: t.tasks.task3Sub, tag: t.tasks.task3Tag, tagColor: '#ccff00', icon: Clock3 },
  ]

  const textMuted = isDark ? 'text-white/35' : 'text-black/40'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const tickFill  = isDark ? '#555'          : '#999'

  return (
    <div className="space-y-8 md:space-y-10">

      {/* ═══ HERO ═══════════════════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Priority badge — spans 2 cols on lg */}
        <motion.div {...fadeUp(0)}
          className="lg:col-span-2 rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(135deg,rgba(204,255,0,0.1),rgba(0,0,0,0))'
              : 'linear-gradient(135deg,rgba(204,255,0,0.18),rgba(255,255,255,0))',
            border: '1px solid rgba(204,255,0,0.25)',
            boxShadow: '0 0 40px rgba(204,255,0,0.08)',
          }}
        >
          <div className="absolute right-0 top-0 w-48 h-48 opacity-[0.06]"
            style={{ background: 'radial-gradient(circle,#ccff00,transparent 70%)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#ccff00', boxShadow: '0 0 6px #ccff00' }} />
              <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase" style={{ color: '#ccff00' }}>
                {t.hero.badge}
              </span>
            </div>
            <p className={clsx('text-xl md:text-2xl font-black leading-tight', textMain)}>
              {t.hero.badgeSub}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '73%' }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#ccff0088,#ccff00)', boxShadow: '0 0 8px #ccff00' }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: '#ccff00' }}>73%</span>
            </div>
          </div>
        </motion.div>

        {/* Revenue at Risk */}
        <motion.div {...fadeUp(0.1)}>
          <Card glowColor="#ff0055" className="p-5 md:p-6 h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.58rem] font-bold tracking-[0.16em] uppercase" style={{ color: '#ff0055', opacity: 0.8 }}>
                {t.hero.revenueAtRisk}
              </span>
              <TrendingDown size={16} style={{ color: '#ff0055' }} />
            </div>
            <div className="font-black leading-none mb-2"
              style={{
                fontSize: 'clamp(2rem,5vw,3rem)',
                color: '#ff0055',
                textShadow: '0 0 20px rgba(255,0,85,0.7)',
              }}>
              ${(stats.total_revenue_at_risk / 1_000_000).toFixed(1)}M
            </div>
            <p className={clsx('text-[0.62rem] leading-snug', textMuted)}>{t.hero.revenueAtRiskSub}</p>
            <div className="mt-3 h-px" style={{ background: 'linear-gradient(90deg,transparent,#ff005560,transparent)' }} />
          </Card>
        </motion.div>

        {/* Recoverable Revenue */}
        <motion.div {...fadeUp(0.18)}>
          <Card glowColor="#ccff00" className="p-5 md:p-6 h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.58rem] font-bold tracking-[0.16em] uppercase" style={{ color: '#ccff00', opacity: 0.8 }}>
                {t.hero.recoverableRevenue}
              </span>
              <TrendingUp size={16} style={{ color: '#ccff00' }} />
            </div>
            <div className="font-black leading-none mb-2"
              style={{
                fontSize: 'clamp(2rem,5vw,3rem)',
                color: '#ccff00',
                textShadow: '0 0 20px rgba(204,255,0,0.7)',
              }}>
              ${(stats.recoverable_assets / 1_000_000).toFixed(1)}M
            </div>
            <p className={clsx('text-[0.62rem] leading-snug', textMuted)}>{t.hero.recoverableRevenueSub}</p>
            <div className="mt-3 h-px" style={{ background: 'linear-gradient(90deg,transparent,#ccff0060,transparent)' }} />
          </Card>
        </motion.div>

        {/* Total Churned */}
        <motion.div {...fadeUp(0.24)}>
          <Card className="p-5 md:p-6">
            <p className={clsx('text-[0.58rem] font-bold tracking-[0.16em] uppercase mb-3', isDark ? 'text-white/40' : 'text-black/40')}>
              {t.hero.totalChurned}
            </p>
            <div className="font-black leading-none mb-1"
              style={{
                fontSize: 'clamp(1.8rem,4vw,2.6rem)',
                color: isDark ? '#fff' : '#111',
                textShadow: isDark ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
              }}>
              {stats.total_churned_users.toLocaleString()}
            </div>
            <p className={clsx('text-[0.62rem]', textMuted)}>{t.common.thisPeriod}</p>
          </Card>
        </motion.div>

        {/* Engine Health */}
        <motion.div {...fadeUp(0.3)}>
          <Card className="p-5 md:p-6">
            <p className={clsx('text-[0.58rem] font-bold tracking-[0.16em] uppercase mb-3', isDark ? 'text-white/40' : 'text-black/40')}>
              {t.hero.engineHealth}
            </p>
            <div className="font-black leading-none mb-1"
              style={{
                fontSize: 'clamp(1.8rem,4vw,2.6rem)',
                color: '#ccff00',
                textShadow: '0 0 20px rgba(204,255,0,0.7)',
              }}>
              {stats.engine_health_pct.toFixed(2)}<span className="text-2xl">%</span>
            </div>
            <p className={clsx('text-[0.62rem]', textMuted)}>{t.hero.engineHealthVal}</p>
          </Card>
        </motion.div>
      </section>

      {/* ═══ PM TASKS ═══════════════════════════════════ */}
      <motion.section {...fadeUp(0.2)}>
        <Card>
          <div className="p-5 md:p-6 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>{t.tasks.title}</h2>
                <p className={clsx('text-xs mt-0.5', textMuted)}>{t.tasks.sub}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.6rem] font-bold"
                style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)', color: '#ccff00' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ccff00' }} />
                {tasks.filter(tk => !tk.done).length} {t.common.pending}
              </div>
            </div>
          </div>

          <div className="divide-y"
            style={{ '--divider': isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
            {taskDefs.map((task, i) => {
              const Icon = task.icon
              const taskState = tasks.find(tk => tk.id === task.key) ?? {}
              const isDone = taskState.done ?? false
              const isExporting = taskState.exporting ?? false
              const isExported  = taskState.exported  ?? false
              return (
                <motion.div
                  key={task.key}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="p-5 md:p-6 flex items-start gap-4 group transition-colors duration-200"
                  style={{
                    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    background: isDone ? (isDark ? 'rgba(204,255,0,0.03)' : 'rgba(204,255,0,0.05)') : 'transparent',
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => markDone(task.key)}
                    className={clsx(
                      'flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 mt-0.5',
                      isDone
                        ? 'border-transparent'
                        : isDark ? 'border-white/20 hover:border-white/40' : 'border-black/20 hover:border-black/40',
                    )}
                    style={isDone ? { background: '#ccff00' } : {}}
                  >
                    {isDone && <Check size={12} color="#000" strokeWidth={3} />}
                  </button>

                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${task.tagColor}12` }}>
                    <Icon size={18} style={{ color: task.tagColor }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={clsx(
                        'text-sm font-bold',
                        isDone ? (isDark ? 'text-white/40 line-through' : 'text-black/40 line-through') : textMain,
                      )}>
                        {task.title}
                      </span>
                      <span className="text-[0.58rem] font-black px-2 py-0.5 rounded-md tracking-widest"
                        style={{
                          color: task.tagColor === '#ccff00' ? '#000' : task.tagColor,
                          background: `${task.tagColor}1a`,
                          border: `1px solid ${task.tagColor}33`,
                        }}>
                        {task.tag}
                      </span>
                    </div>
                    <p className={clsx('text-xs leading-snug', isDone ? (isDark ? 'text-white/25' : 'text-black/25') : textMuted)}>
                      {task.sub}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
                    <button
                      onClick={() => markDone(task.key)}
                      className={clsx(
                        'text-xs font-bold px-3 py-2 rounded-lg transition-all duration-200',
                        isDone
                          ? isDark ? 'text-white/25 bg-white/[0.05]' : 'text-black/25 bg-black/[0.05]'
                          : 'text-black bg-[#ccff00] hover:shadow-[0_0_12px_rgba(204,255,0,0.4)]',
                      )}
                    >
                      {isDone ? '✓' : t.tasks.markDone}
                    </button>
                    <button
                      onClick={() => exportPdf(task.key)}
                      disabled={isExporting || isExported}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all duration-200 border',
                        isExported
                          ? 'text-black border-transparent'
                          : isDark
                            ? 'text-white/40 border-white/[0.1] hover:text-white hover:border-white/30'
                            : 'text-black/40 border-black/[0.1] hover:text-black hover:border-black/30',
                      )}
                      style={isExported ? { background: '#ccff00', boxShadow: '0 0 10px rgba(204,255,0,0.35)' } : {}}
                    >
                      {isExporting
                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                            className="w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                        : <FileDown size={12} />}
                      {isExported ? t.tasks.exported : isExporting ? t.tasks.exporting : t.tasks.exportPdf}
                    </button>
                    <button
                      onClick={() => onNavigate?.('taskDetail', task.key)}
                      className={clsx('text-xs font-semibold flex items-center gap-1 px-2 py-2', isDark ? 'text-white/30 hover:text-white' : 'text-black/30 hover:text-black')}
                    >
                      {t.tasks.viewDetails} <ArrowRight size={11} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      </motion.section>

      {/* ═══ CHARTS ══════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">

        {/* Bar chart */}
        <motion.div {...fadeUp(0.3)} className="lg:col-span-3">
          <Card className="p-5 md:p-6 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className={clsx('text-base md:text-lg font-bold', textMain)}>{t.charts.churnDriversTitle}</h3>
                <p className={clsx('text-xs mt-0.5', textMuted)}>{t.charts.churnDriversSub}</p>
              </div>
              <div className="flex gap-3">
                {[['#ccff00', t.charts.recoverable], ['#ff0055', t.charts.lost]].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
                    <span className={clsx('text-xs', textMuted)}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barSize={64}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="segment" tick={{ fill: tickFill, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 7]} tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <ReTooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                <Bar dataKey="days" shape={<CustomBar />}>
                  {barData.map((e, i) => <Cell key={i} fill={e.color} color={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Pie chart */}
        <motion.div {...fadeUp(0.38)} className="lg:col-span-2">
          <Card className="p-5 md:p-6 h-full">
            <div className="mb-4">
              <h3 className={clsx('text-base md:text-lg font-bold', textMain)}>{t.charts.techFailureTitle}</h3>
              <p className={clsx('text-xs mt-0.5', textMuted)}>{t.charts.techFailureSub}</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={58} outerRadius={96}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {PIE_DATA.map((e, i) => (
                        <Cell key={i} fill={e.color} style={{ filter: `drop-shadow(0 0 7px ${e.color}88)` }} />
                      ))}
                    </Pie>
                    <ReTooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={clsx('text-xl font-black', textMain)}>{pieTotal.toLocaleString()}</span>
                  <span className={clsx('text-[0.6rem]', textMuted)}>{t.common.total}</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                {PIE_DATA.map(e => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: e.color, boxShadow: `0 0 4px ${e.color}` }} />
                      <span className={clsx('text-xs', textMuted)}>{e.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: e.color }}>
                      {e.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ═══ DEEP SCAN ═══════════════════════════════════ */}
      <motion.section {...fadeUp(0.45)}>
        <Card className="p-5 md:p-6">
          <div className="mb-5">
            <h2 className={clsx('text-xl md:text-2xl font-black', textMain)}>{t.scan.title}</h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>{t.scan.sub}</p>
          </div>

          <label className="block text-[0.6rem] font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#ccff00' }}>
            {t.scan.label}
          </label>

          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runScan()}
                placeholder={t.scan.placeholder}
                className={clsx(
                  'w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono outline-none transition-all duration-200',
                  isDark ? 'bg-[#050505] text-white placeholder-white/20' : 'bg-gray-50 text-black placeholder-black/25',
                )}
                style={{
                  border: '1px solid rgba(204,255,0,0.45)',
                }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(204,255,0,0.3), 0 0 20px rgba(204,255,0,0.08)' }}
                onBlur={e => { e.target.style.boxShadow = 'none' }}
              />
            </div>
            <motion.button
              onClick={runScan}
              disabled={scanning || !query.trim()}
              whileTap={{ scale: 0.96 }}
              className="btn-lime flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm w-full sm:w-auto"
            >
              {scanning ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-black/25 border-t-black rounded-full" />
                  {t.scan.scanning}
                </>
              ) : (
                <><Zap size={14} strokeWidth={3} />{t.scan.runBtn}</>
              )}
            </motion.button>
          </div>

          <p className={clsx('text-[0.62rem] mb-4', textMuted)}>
            {t.scan.tryLabel}{' '}
            {['0', '1', '3', '4', '5'].map((id, i, arr) => (
              <span key={id}>
                <button onClick={() => setQuery(id)}
                  className={clsx('font-mono transition-colors', isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black')}>
                  {id}
                </button>
                {i < arr.length - 1 && <span className="mx-1 opacity-30">·</span>}
              </span>
            ))}
          </p>

          {/* Error */}
          <AnimatePresence>
            {scanError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: 'rgba(255,0,85,0.08)', border: '1px solid rgba(255,0,85,0.25)' }}>
                <XCircle size={15} style={{ color: '#ff0055' }} />
                <span className="text-sm" style={{ color: '#ff0055' }}>{scanError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.32 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: `1px solid ${scanResult.riskColor}28`,
                  boxShadow: `0 0 32px ${scanResult.riskColor}10`,
                }}
              >
                {/* Result header */}
                <div className="p-5 flex items-start justify-between gap-3"
                  style={{ background: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(250,250,250,0.95)' }}>
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className={clsx('text-lg font-black', textMain)}>{scanResult.name}</span>
                      <span className="text-[0.58rem] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: `${scanResult.riskColor}18`, color: scanResult.riskColor }}>
                        {scanResult.plan}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {scanResult.metrics && (
                        <>
                          <span className={clsx('text-[0.58rem] font-mono', textMuted)}>
                            gen_total: <span className="font-bold" style={{ color: scanResult.riskColor }}>{scanResult.metrics.gen_total}</span>
                          </span>
                          <span className={clsx('text-[0.58rem] font-mono', textMuted)}>
                            completion: <span className="font-bold" style={{ color: scanResult.riskColor }}>
                              {((scanResult.metrics.gen_completed ?? 0) * 100).toFixed(1)}%
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-4xl font-black" style={{ color: scanResult.riskColor, textShadow: `0 0 14px ${scanResult.riskColor}` }}>
                      {scanResult.riskScore}
                    </div>
                    <div className="text-[0.6rem] font-bold tracking-widest" style={{ color: scanResult.riskColor }}>
                      {t.common[scanResult.riskLevel.toLowerCase()] || scanResult.riskLevel}
                    </div>
                    <div className={clsx('text-[0.58rem] mt-0.5', textMuted)}>
                      {t.common[scanResult.churnType] || scanResult.churnType} {t.scan.churnRisk}
                    </div>
                  </div>
                </div>

                {/* Risk bar */}
                <div className="px-5 py-2" style={{ background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(248,248,248,0.97)' }}>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scanResult.riskScore}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg,${scanResult.riskColor}55,${scanResult.riskColor})`, boxShadow: `0 0 6px ${scanResult.riskColor}` }}
                    />
                  </div>
                </div>

                {/* Root Cause factors */}
                <div className="px-5 pt-3 pb-3 space-y-2"
                  style={{ background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(248,248,248,0.97)' }}>
                  <p className={clsx('text-[0.58rem] font-bold tracking-[0.16em] uppercase mb-3', textMuted)}>
                    {t.scan.rootCause}
                  </p>
                  {scanResult.factors.map((f, i) => {
                    const Icon = f.icon
                    const cfg = sevCfg[f.severity]
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.07 * i + 0.2 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cfg.color}14` }}>
                          <Icon size={13} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: cfg.color }}>{f.labelKey}</p>
                          <p className={clsx('text-[0.62rem] mt-0.5', textMuted)}>{f.detail}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* AI Recommendation */}
                <div className="px-5 pb-5"
                  style={{ background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(248,248,248,0.97)' }}>
                  <div className="rounded-xl p-4 mb-4"
                    style={{ background: 'rgba(204,255,0,0.05)', border: '1px solid rgba(204,255,0,0.18)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Zap size={12} style={{ color: '#ccff00' }} />
                      <span className="text-[0.58rem] font-bold tracking-widest uppercase" style={{ color: '#ccff00' }}>
                        {t.scan.aiRec}
                      </span>
                    </div>
                    <p className={clsx('text-xs leading-relaxed', textMuted)}>{scanResult.rec}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => !outreachSent && sendAction('outreach')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[0.72rem] font-bold border transition-all duration-200"
                      style={outreachSent
                        ? { opacity: 0.5, cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.1)', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }
                        : { border: '1px solid rgba(204,255,0,0.3)', color: '#ccff00', background: 'rgba(204,255,0,0.06)' }
                      }
                    >
                      {outreachSent ? <><Check size={11} strokeWidth={3} /> {t.common.actionSent}</> : <><ArrowRight size={11} strokeWidth={2.5} /> {t.common.sendOutreach}</>}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => !discountSent && sendAction('discount')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[0.72rem] font-bold border transition-all duration-200"
                      style={discountSent
                        ? { opacity: 0.5, cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.1)', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }
                        : { border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff', background: 'rgba(0,229,255,0.06)' }
                      }
                    >
                      {discountSent ? <><Check size={11} strokeWidth={3} /> {t.common.actionSent}</> : <><Zap size={11} strokeWidth={2.5} /> {t.common.offerDiscount}</>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.section>

      {/* ─── Action Toast ────────────────────────────── */}
      <AnimatePresence>
        {actionToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(0,0,0,0.92)',
              border: '1px solid rgba(204,255,0,0.35)',
              boxShadow: '0 0 32px rgba(204,255,0,0.18)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <Check size={16} style={{ color: '#ccff00' }} />
            <span className="text-sm font-bold text-white">{actionToast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
