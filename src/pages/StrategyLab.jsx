import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, RefreshCw, BookOpen, Zap, ChevronRight,
  ArrowRight, Brain, MessageSquare, BarChart2, Layers,
  CheckCircle2, Circle, TrendingUp, ShieldCheck, Lock, EyeOff,
} from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { clsx } from 'clsx'

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
    { hour: '0h', label: isDark ? 'Payment Fails' : 'Payment Fails', icon: '⚠️', done: true },
    { hour: '1h', label: 'Auto Retry #1', icon: '🔄', done: true },
    { hour: '24h', label: 'CSM Notified', icon: '📬', done: true },
    { hour: '48h', label: 'Auto Retry #2', icon: '🔄', done: false },
    { hour: '72h', label: 'Grace Ends', icon: '⏰', done: false },
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
function EducationFunnel({ isDark }) {
  const steps = [
    { label: 'Disengaged User Detected', pct: 100, color: '#ff0055' },
    { label: 'Feature Discovery Email', pct: 68, color: '#ff8800' },
    { label: 'In-App Tooltip Triggered', pct: 45, color: '#ccff00' },
    { label: 'Power Feature Activated', pct: 29, color: '#00ccff' },
    { label: 'Churn Risk Neutralised', pct: 18, color: '#8800ff' },
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
      visual: (isDark) => <EducationFunnel isDark={isDark} />,
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
                    <div>
                      <h3 className={clsx('text-base font-black leading-snug', textMain)}>{card.title}</h3>
                      <p className={clsx('text-xs mt-0.5 leading-snug', textMuted)}>{card.sub}</p>
                    </div>
                  </div>

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
                  { label: 'PM Actions Logged',       value: '1,284',  color: '#ccff00', pct: 82 },
                  { label: 'Model Re-weights',         value: '47',     color: '#00ccff', pct: 61 },
                  { label: 'Confidence Score Avg',     value: '0.87',   color: '#ff8800', pct: 87 },
                  { label: 'Recommendation Accuracy',  value: '91.7%',  color: '#ccff00', pct: 92 },
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
                  Trigger Manual Re-train
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
                    {['Raw Data', '→', 'PII Strip', '→', 'Masked Features', '→', 'AI Model'].map((item, i) => (
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
                      { label: 'React Frontend', color: '#00ccff' },
                      { label: '↓ POST /ai/consult', color: isDark ? '#555' : '#aaa' },
                      { label: 'FastAPI Gateway (anonymize)', color: '#22c55e' },
                      { label: '↓ Sanitized payload only', color: isDark ? '#555' : '#aaa' },
                      { label: 'OpenAI API', color: '#ff8800' },
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
                    Model inputs (anonymized only)
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

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} style={{ color: '#ccff00' }} />
                <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase" style={{ color: '#ccff00' }}>
                  Implementation Timeline
                </span>
              </div>
              <h3 className={clsx('text-2xl md:text-3xl font-black leading-tight', textMain)}>
                Full deployment in{' '}
                <span className="neon-lime" style={{ color: '#ccff00' }}>14 days</span>
              </h3>
              <p className={clsx('text-xs mt-1', textMuted)}>
                Grace periods + Dunning active in week 1. Educational sequences live week 2.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="btn-lime flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm">
                <Zap size={13} strokeWidth={3} />
                Approve All Strategies
              </button>
              <button className={clsx(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border transition-all',
                isDark ? 'border-white/15 text-white/60 hover:text-white hover:border-white/30' : 'border-black/15 text-black/60 hover:text-black hover:border-black/30',
              )}>
                <ChevronRight size={13} />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
