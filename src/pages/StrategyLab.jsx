import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, RefreshCw, BookOpen, Zap, ChevronRight,
  ArrowRight, Brain, MessageSquare, BarChart2, Layers,
  CheckCircle2, Circle, TrendingUp, ShieldCheck, Lock, EyeOff,
  Download, CheckCheck, Activity,
} from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { fetchUsers } from '../services/api'
import { clsx } from 'clsx'

// ─── CSV export ───────────────────────────────
// Serializes a single CSV cell, quoting + escaping any value that contains
// commas, quotes, or newlines (RFC 4180-safe enough for our demo export).
function csvCell(val) {
  const s = val == null ? '' : String(val)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function exportCSV() {
  const header = ['user_id','risk_score','churn_type','risk_level','gen_failed','gen_total','frustration','sub_weekday','gen_completed','summary','model_source']
  let dataRows = []
  try {
    const data = await fetchUsers()
    dataRows = (data?.users ?? []).map(u => {
      const m = u.metrics ?? {}
      return [
        u.id,
        u.risk_score,
        u.churn_type,
        u.risk_level,
        m.gen_failed,
        m.gen_total,
        m.frustration,
        m.sub_weekday,
        m.gen_completed,
        u.summary,
        u.model_source,
      ]
    })
  } catch {
    // If the backend is unreachable, fall through to an empty export so
    // the user still gets a file with just the header row.
  }

  const content = [header, ...dataRows].map(r => r.map(csvCell).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'retention_report.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Toggle switch ────────────────────────────
function ToggleSwitch({ on, onChange, color = '#ccff00' }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 w-10 h-5 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        background: on ? color : 'rgba(128,128,128,0.2)',
        boxShadow: on ? `0 0 10px ${color}55` : 'none',
      }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{ background: on ? '#000' : '#fff' }}
      />
    </button>
  )
}

// ─── Toast notification ───────────────────────
function Toast({ show, msg, onDone }) {
  useEffect(() => {
    if (!show) return
    const id = setTimeout(onDone, 3200)
    return () => clearTimeout(id)
  }, [show, onDone])

  return (
    <AnimatePresence>
      {show && (
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
          <CheckCheck size={16} style={{ color: '#ccff00' }} />
          <span className="text-sm font-bold text-white">{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── helpers ──────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.44, ease: 'easeOut' },
})

// Reusable card wrapper
function Card({ children, className = '', glowColor, accent }) {
  const { isDark } = useTheme()
  return (
    <div
      className={clsx(
        'rounded-2xl backdrop-blur-xl border transition-colors duration-300 overflow-hidden',
        isDark ? 'bg-[rgba(10,10,10,0.82)] border-white/[0.07]' : 'bg-white/82 border-black/[0.07]',
        className,
      )}
      style={{
        boxShadow: glowColor ? `0 0 40px ${glowColor}10` : undefined,
        borderTop: accent ? `2px solid ${accent}` : undefined,
      }}
    >
      {children}
    </div>
  )
}

// Stat tile inside strategy cards
function StatTile({ label, value, color, isDark }) {
  return (
    <div
      className="flex-1 rounded-xl p-3 text-center"
      style={{ background: `${color}0c`, border: `1px solid ${color}22` }}
    >
      <div
        className="text-2xl font-black leading-none"
        style={{ color, textShadow: `0 0 14px ${color}88` }}
      >
        {value}
      </div>
      <div className={clsx('text-[0.58rem] font-semibold mt-1 uppercase tracking-widest', isDark ? 'text-white/35' : 'text-black/40')}>
        {label}
      </div>
    </div>
  )
}

// Grace period timeline visualiser
function GraceTimeline({ t, isDark }) {
  const steps = [
    { hour: '0h', label: t.strategy.graceStep1, icon: '⚠️', done: true },
    { hour: '1h', label: t.strategy.graceStep2, icon: '🔄', done: true },
    { hour: '24h', label: t.strategy.graceStep3, icon: '📬', done: true },
    { hour: '48h', label: t.strategy.graceStep4, icon: '🔄', done: false },
    { hour: '72h', label: t.strategy.graceStep5, icon: '⏰', done: false },
  ]
  return (
    <div className="mt-5 relative">
      <div className="absolute top-4 left-4 right-4 h-0.5"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
      <motion.div
        className="absolute top-4 left-4 h-0.5"
        initial={{ width: 0 }}
        animate={{ width: '55%' }}
        transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
        style={{ background: 'linear-gradient(90deg,#ccff0088,#ccff00)', boxShadow: '0 0 6px #ccff00' }}
      />
      <div className="relative flex justify-between">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all z-10')}
              style={{
                background: s.done ? '#ccff00' : (isDark ? '#111' : '#f5f5f5'),
                borderColor: s.done ? '#ccff00' : (isDark ? '#333' : '#ddd'),
                boxShadow: s.done ? '0 0 10px rgba(204,255,0,0.5)' : 'none',
              }}
            >
              {s.done
                ? <CheckCircle2 size={14} color="#000" />
                : <Circle size={14} style={{ color: isDark ? '#444' : '#ccc' }} />
              }
            </div>
            <span className="text-[0.58rem] font-bold" style={{ color: s.done ? '#ccff00' : (isDark ? '#555' : '#aaa') }}>
              {s.hour}
            </span>
            <span className={clsx('text-[0.55rem] text-center leading-tight max-w-[48px]',
              isDark ? 'text-white/40' : 'text-black/40')}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Dunning schedule visualiser
function DunningGrid({ isDark }) {
  const slots = [
    { tz: 'UTC−5', times: ['09:00', '13:00', '19:00'], active: [true, false, true] },
    { tz: 'UTC+0', times: ['08:00', '12:00', '18:00'], active: [false, true, true] },
    { tz: 'UTC+5', times: ['07:00', '11:00', '17:00'], active: [true, true, false] },
    { tz: 'UTC+8', times: ['10:00', '14:00', '20:00'], active: [false, true, true] },
  ]
  return (
    <div className="mt-5 space-y-2.5">
      {slots.map((row, i) => (
        <motion.div key={row.tz}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.07 }}
          className="flex items-center gap-3">
          <span className="text-[0.6rem] font-mono w-12 flex-shrink-0 text-right"
            style={{ color: isDark ? '#666' : '#999' }}>
            {row.tz}
          </span>
          <div className="flex gap-1.5 flex-1">
            {row.times.map((time, j) => (
              <div key={j}
                className="flex-1 text-center py-1.5 rounded-lg text-[0.55rem] font-bold transition-all"
                style={{
                  background: row.active[j]
                    ? isDark ? 'rgba(204,255,0,0.15)' : 'rgba(100,163,13,0.15)'
                    : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  color: row.active[j]
                    ? isDark ? '#ccff00' : '#4d7c0f'
                    : isDark ? '#444' : '#ccc',
                  border: `1px solid ${row.active[j] ? (isDark ? 'rgba(204,255,0,0.2)' : 'rgba(100,163,13,0.2)') : 'transparent'}`,
                }}>
                {time}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Educational funnel
function EducationFunnel({ isDark, t }) {
  const steps = [
    { label: t.strategy.funnelStep1, pct: 100, color: '#ff0055' },
    { label: t.strategy.funnelStep2, pct: 68, color: '#ff8800' },
    { label: t.strategy.funnelStep3, pct: 45, color: '#ccff00' },
    { label: t.strategy.funnelStep4, pct: 29, color: '#00ccff' },
    { label: t.strategy.funnelStep5, pct: 18, color: '#8800ff' },
  ]
  return (
    <div className="mt-5 space-y-2">
      {steps.map((s, i) => (
        <motion.div key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 + i * 0.08 }}>
          <div className="flex items-center justify-between mb-1">
            <span className={clsx('text-[0.62rem]', isDark ? 'text-white/50' : 'text-black/50')}>{s.label}</span>
            <span className="text-[0.62rem] font-bold" style={{ color: s.color }}>{s.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ duration: 0.9, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.color}66` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Feedback loop step
function FeedbackStep({ icon: Icon, label, color, index, isDark, isLast }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 + index * 0.12, type: 'spring', stiffness: 280, damping: 22 }}
        className="flex flex-col items-center"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className={clsx('text-[0.58rem] font-semibold mt-1.5 text-center max-w-[60px] leading-tight',
          isDark ? 'text-white/40' : 'text-black/40')}>
          {label}
        </span>
      </motion.div>
      {!isLast && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.55 + index * 0.12 }}
          className="flex-1 flex items-center"
          style={{ transformOrigin: 'left' }}
        >
          <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          <ArrowRight size={10} style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', flexShrink: 0 }} />
        </motion.div>
      )}
    </div>
  )
}

// ─── main component ────────────────────────────
export default function StrategyLab() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const [activeCard, setActiveCard] = useState(null)
  const [approveApplied, setApproveApplied] = useState(false)
  const [weekDone, setWeekDone] = useState([false, false])
  const [strategyToggles, setStrategyToggles] = useState({ grace: false, dunning: false, education: false })
  const [toast, setToast] = useState({ show: false, msg: '' })

  function showToast(msg) { setToast({ show: true, msg }) }
  function hideToast() { setToast(t => ({ ...t, show: false })) }

  function handleApproveAll() {
    if (approveApplied) return
    setApproveApplied(true)
    setStrategyToggles({ grace: true, dunning: true, education: true })
    showToast(s.protocolsActivated)
  }

  function toggleWeek(i) {
    setWeekDone(prev => prev.map((v, j) => j === i ? !v : v))
  }

  const textMuted = isDark ? 'text-white/40' : 'text-black/40'
  const textMain  = isDark ? 'text-white'    : 'text-black'
  const s = t.strategy

  const cards = [
    {
      id: 'grace',
      icon: Clock,
      accent: '#ccff00',
      title: s.card1Title,
      sub: s.card1Sub,
      desc: s.card1Desc,
      stats: [
        { label: s.card1Stat1Label, value: s.card1Stat1Val },
        { label: s.card1Stat2Label, value: s.card1Stat2Val },
        { label: s.card1Stat3Label, value: s.card1Stat3Val },
      ],
      visual: (isDark) => <GraceTimeline t={t} isDark={isDark} />,
    },
    {
      id: 'dunning',
      icon: RefreshCw,
      accent: '#00ccff',
      title: s.card2Title,
      sub: s.card2Sub,
      desc: s.card2Desc,
      stats: [
        { label: s.card2Stat1Label, value: s.card2Stat1Val },
        { label: s.card2Stat2Label, value: s.card2Stat2Val },
        { label: s.card2Stat3Label, value: s.card2Stat3Val },
      ],
      visual: (isDark) => <DunningGrid isDark={isDark} />,
    },
    {
      id: 'education',
      icon: BookOpen,
      accent: '#ff8800',
      title: s.card3Title,
      sub: s.card3Sub,
      desc: s.card3Desc,
      stats: [
        { label: s.card3Stat1Label, value: s.card3Stat1Val },
        { label: s.card3Stat2Label, value: s.card3Stat2Val },
        { label: s.card3Stat3Label, value: s.card3Stat3Val },
      ],
      visual: (isDark) => <EducationFunnel isDark={isDark} t={t} />,
    },
  ]

  const feedbackSteps = [
    { icon: MessageSquare, label: s.feedbackStep1, color: '#ccff00' },
    { icon: Brain,         label: s.feedbackStep2, color: '#00ccff' },
    { icon: BarChart2,     label: s.feedbackStep3, color: '#ff8800' },
    { icon: TrendingUp,    label: s.feedbackStep4, color: '#ccff00' },
  ]

  return (
    <div className="space-y-10 md:space-y-12">

      {/* ═══ Page header ════════════════════════════════ */}
      <motion.div {...fadeUp(0)}>
        <div className="flex items-start gap-4 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: '#ccff00', boxShadow: '0 0 20px rgba(204,255,0,0.4)' }}>
            <Layers size={20} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={clsx('text-3xl md:text-4xl font-black leading-tight', textMain)}>
              {s.title.split(' ').map((word, i) => (
                <span key={i}>
                  {i === 1
                    ? <span style={{ color: '#ccff00', textShadow: '0 0 24px rgba(204,255,0,0.5)' }}>{word} </span>
                    : `${word} `
                  }
                </span>
              ))}
            </h1>
            <p className={clsx('text-sm mt-1', textMuted)}>{s.sub}</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ 3 Strategy Cards ═══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon
          const isExpanded = activeCard === card.id
          const isOn = strategyToggles[card.id]
          return (
            <motion.div key={card.id} {...fadeUp(0.1 + i * 0.1)}>
              <Card accent={card.accent} glowColor={card.accent} className="h-full flex flex-col">

                {/* Card header */}
                <div className="p-5 md:p-6 border-b"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${card.accent}14`, border: `1px solid ${card.accent}28` }}>
                      <Icon size={18} style={{ color: card.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={clsx('text-base font-black leading-snug', textMain)}>{card.title}</h3>
                      <p className={clsx('text-xs mt-0.5 leading-snug', textMuted)}>{card.sub}</p>
                    </div>
                    {/* Toggle switch */}
                    <ToggleSwitch
                      on={isOn}
                      color={card.accent}
                      onChange={(val) => setStrategyToggles(prev => ({ ...prev, [card.id]: val }))}
                    />
                  </div>

                  {/* Live badge for grace toggle */}
                  <AnimatePresence>
                    {card.id === 'grace' && isOn && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.62rem] font-bold overflow-hidden"
                        style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.22)', color: '#ccff00' }}
                      >
                        <Activity size={11} strokeWidth={3} className="animate-pulse" />
                        {s.monitoringLive}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats row */}
                  <div className="flex gap-2">
                    {card.stats.map((stat) => (
                      <StatTile key={stat.label} label={stat.label} value={stat.value}
                        color={card.accent} isDark={isDark} />
                    ))}
                  </div>
                </div>

                {/* Description + visual */}
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  <p className={clsx('text-xs leading-relaxed', textMuted)}>{card.desc}</p>

                  {/* Visual component */}
                  {card.visual(isDark)}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setActiveCard(isExpanded ? null : card.id)}
                    className={clsx(
                      'mt-5 flex items-center gap-1.5 text-xs font-bold self-start transition-colors',
                      isDark ? 'text-white/30 hover:text-white' : 'text-black/30 hover:text-black',
                    )}
                  >
                    {isExpanded ? t.common.viewAll : t.common.learnMore}
                    <ChevronRight size={12} className={clsx('transition-transform', isExpanded && 'rotate-90')} />
                  </button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ═══ Feedback Loop ══════════════════════════════ */}
      <motion.section {...fadeUp(0.4)}>
        <Card glowColor="#ccff00">
          {/* Header */}
          <div className="p-5 md:p-6 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)' }}>
                <Brain size={18} style={{ color: '#ccff00' }} />
              </div>
              <div>
                <h2 className={clsx('text-xl md:text-2xl font-black', textMain)}>{s.feedbackTitle}</h2>
                <p className={clsx('text-xs mt-0.5', textMuted)}>{s.feedbackSub}</p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

              {/* Steps flow */}
              <div>
                <p className={clsx('text-sm leading-relaxed mb-6', textMuted)}>{s.feedbackDesc}</p>
                <div className="flex items-start gap-1 overflow-x-auto pb-2">
                  {feedbackSteps.map((step, i) => (
                    <FeedbackStep
                      key={i}
                      icon={step.icon}
                      label={step.label}
                      color={step.color}
                      index={i}
                      isDark={isDark}
                      isLast={i === feedbackSteps.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Live metric panel */}
              <div className="space-y-3">
                {[
                  { label: s.pmActionsLogged,  value: '1,284',  color: '#ccff00', pct: 82 },
                  { label: s.modelReweights,   value: '47',     color: '#00ccff', pct: 61 },
                  { label: s.confidenceAvg,    value: '0.87',   color: '#ff8800', pct: 87 },
                  { label: s.recAccuracy,      value: '91.7%',  color: '#ccff00', pct: 92 },
                ].map((metric, i) => (
                  <motion.div key={metric.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className={clsx(
                      'flex items-center gap-3 p-3.5 rounded-xl',
                      isDark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-black/[0.03] border border-black/[0.05]',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={clsx('text-xs', textMuted)}>{metric.label}</span>
                        <span className="text-sm font-black" style={{ color: metric.color }}>
                          {metric.value}
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden"
                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.pct}%` }}
                          transition={{ duration: 0.9, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: metric.color, boxShadow: `0 0 6px ${metric.color}55` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Retrain CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="btn-lime w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm mt-1"
                >
                  <Zap size={14} strokeWidth={3} />
                  {s.triggerRetrain}
                </motion.button>
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══ Security & Methodology ════════════════════ */}
      <motion.section {...fadeUp(0.5)}>
        <Card glowColor="#22c55e" accent="#22c55e">
          {/* Header */}
          <div className="p-5 md:p-6 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)' }}>
                <ShieldCheck size={18} style={{ color: '#22c55e' }} />
              </div>
              <div className="flex-1">
                <h2 className={clsx('text-xl md:text-2xl font-black', textMain)}>
                  {s.securityTitle}
                </h2>
                <p className={clsx('text-xs mt-0.5', textMuted)}>{s.securitySub}</p>
              </div>

              {/* Compliance badges */}
              <div className="hidden sm:flex flex-wrap gap-1.5 justify-end">
                {[s.securityBadge1, s.securityBadge2, s.securityBadge3, s.securityBadge4].map((badge) => (
                  <span key={badge}
                    className="text-[0.52rem] font-bold px-2 py-1 rounded-lg"
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.22)',
                      color: '#22c55e',
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Method 1 — Feature Masking */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className={clsx(
                  'rounded-xl p-4 flex flex-col gap-3',
                  isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-black/[0.02] border border-black/[0.06]',
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <EyeOff size={15} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <h3 className={clsx('text-sm font-black leading-snug mb-1.5', textMain)}>
                    {s.securityMethod1Title}
                  </h3>
                  <p className={clsx('text-xs leading-relaxed', textMuted)}>
                    {s.securityMethod1Desc}
                  </p>
                </div>
                {/* Pipeline visual */}
                <div className="mt-auto pt-3 border-t"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[s.rawData, '→', s.piiStrip, '→', s.maskedFeatures, '→', s.aiModel].map((item, i) => (
                      <span key={i} className={clsx(
                        'text-[0.5rem] font-bold px-1.5 py-0.5 rounded',
                        item === '→'
                          ? (isDark ? 'text-white/20' : 'text-black/25')
                          : i === 6
                            ? 'text-black'
                            : '',
                      )}
                        style={
                          item !== '→'
                            ? {
                                background: i === 6 ? '#22c55e' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                color: i === 6 ? '#000' : i === 0 ? '#ff5555' : undefined,
                              }
                            : {}
                        }
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Method 2 — Secure AI Gateway */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.63 }}
                className={clsx(
                  'rounded-xl p-4 flex flex-col gap-3',
                  isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-black/[0.02] border border-black/[0.06]',
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <Lock size={15} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <h3 className={clsx('text-sm font-black leading-snug mb-1.5', textMain)}>
                    {s.securityMethod2Title}
                  </h3>
                  <p className={clsx('text-xs leading-relaxed', textMuted)}>
                    {s.securityMethod2Desc}
                  </p>
                </div>
                {/* Architecture diagram */}
                <div className="mt-auto pt-3 border-t"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: s.reactFrontend, color: '#00ccff' },
                      { label: s.postConsult, color: isDark ? '#555' : '#aaa' },
                      { label: s.fastapiGateway, color: '#22c55e' },
                      { label: s.sanitizedPayload, color: isDark ? '#555' : '#aaa' },
                      { label: s.openaiApi, color: '#ff8800' },
                    ].map((row, i) => (
                      <span key={i} className="text-[0.5rem] font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          color: row.color,
                          background: row.label.startsWith('↓') ? 'transparent' : `${row.color}12`,
                          border: row.label.startsWith('↓') ? 'none' : `1px solid ${row.color}28`,
                        }}>
                        {row.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Method 3 — ML Model Integrity */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.71 }}
                className={clsx(
                  'rounded-xl p-4 flex flex-col gap-3',
                  isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-black/[0.02] border border-black/[0.06]',
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <Brain size={15} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <h3 className={clsx('text-sm font-black leading-snug mb-1.5', textMain)}>
                    {s.securityMethod3Title}
                  </h3>
                  <p className={clsx('text-xs leading-relaxed', textMuted)}>
                    {s.securityMethod3Desc}
                  </p>
                </div>
                {/* Features list */}
                <div className="mt-auto pt-3 border-t"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <p className={clsx('text-[0.5rem] font-bold mb-1.5 uppercase tracking-widest', textMuted)}>
                    {s.modelInputsLabel}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['session_days', 'payment_attempts', 'feature_usage_ratio', 'plan_tier', 'ltv_band', 'cohort_age'].map(f => (
                      <span key={f} className="text-[0.48rem] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(34,197,94,0.08)',
                          border: '1px solid rgba(34,197,94,0.18)',
                          color: '#22c55e',
                        }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══ Implementation Roadmap Banner ═════════════ */}
      <motion.div {...fadeUp(0.55)}>
        <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(204,255,0,0.07) 0%, rgba(0,0,0,0) 50%)'
              : 'linear-gradient(135deg, rgba(204,255,0,0.14) 0%, rgba(255,255,255,0) 50%)',
            border: '1px solid rgba(204,255,0,0.2)',
          }}
        >
          <div className="absolute right-0 top-0 w-96 h-full opacity-[0.04]"
            style={{ background: 'radial-gradient(ellipse at right, #ccff00, transparent 70%)' }} />

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} style={{ color: '#ccff00' }} />
                  <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase" style={{ color: '#ccff00' }}>
                    {s.implTimeline}
                  </span>
                </div>
                <h3 className={clsx('text-2xl md:text-3xl font-black leading-tight', textMain)}>
                  {s.fullDeployIn}{' '}
                  <span style={{ color: '#ccff00', textShadow: '0 0 14px rgba(204,255,0,0.4)' }}>{s.fourteenDays}</span>
                </h3>
                <p className={clsx('text-xs mt-1', textMuted)}>
                  {s.implSub}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Approve All */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleApproveAll}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                  style={approveApplied
                    ? { background: 'rgba(204,255,0,0.12)', border: '1px solid rgba(204,255,0,0.3)', color: '#ccff00', cursor: 'default' }
                    : { background: '#ccff00', color: '#000' }}
                >
                  {approveApplied
                    ? <><CheckCheck size={13} strokeWidth={3} /> {s.applied}</>
                    : <><Zap size={13} strokeWidth={3} /> {s.approveAll}</>
                  }
                </motion.button>

                {/* Export CSV */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={exportCSV}
                  className={clsx(
                    'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border transition-all',
                    isDark ? 'border-white/15 text-white/60 hover:text-white hover:border-white/30' : 'border-black/15 text-black/60 hover:text-black hover:border-black/30',
                  )}
                >
                  <Download size={13} />
                  {s.exportReport}
                </motion.button>
              </div>
            </div>

            {/* Week 1 / Week 2 timeline blocks */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {[
                { label: s.week1, desc: s.week1Desc, tasks: [s.week1Task1, s.week1Task2, s.week1Task3] },
                { label: s.week2, desc: s.week2Desc, tasks: [s.week2Task1, s.week2Task2, s.week2Task3] },
              ].map((week, i) => (
                <motion.button
                  key={i}
                  onClick={() => toggleWeek(i)}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 text-left px-5 py-4 rounded-xl border transition-all duration-200"
                  style={weekDone[i]
                    ? { background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.3)' }
                    : { background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.6rem] font-bold tracking-widest uppercase"
                      style={{ color: weekDone[i] ? '#ccff00' : (isDark ? '#555' : '#aaa') }}>
                      {week.label}
                    </span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: weekDone[i] ? '#ccff00' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }}>
                      {weekDone[i]
                        ? <CheckCircle2 size={12} color="#000" />
                        : <Circle size={12} style={{ color: isDark ? '#444' : '#ccc' }} />
                      }
                    </div>
                  </div>
                  <p className={clsx('text-sm font-black leading-snug mb-1.5', textMain)}>{week.desc}</p>
                  <div className="space-y-0.5">
                    {week.tasks.map((task, j) => (
                      <p key={j} className="text-[0.6rem] flex items-center gap-1.5"
                        style={{ color: weekDone[i] ? '#ccff00' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)') }}>
                        <span>{weekDone[i] ? '✓' : '·'}</span> {task}
                      </p>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Toast ────────────────────────────────────── */}
      <Toast show={toast.show} msg={toast.msg} onDone={hideToast} />
    </div>
  )
}
