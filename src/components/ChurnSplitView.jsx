/**
 * ChurnSplitView.jsx
 * Side-by-side strategy view for Voluntary vs Involuntary churn.
 * Each side has causes, a vertical timeline, and stat tiles.
 * Sources: Focus Digital (2025), El Attar & El-Hajj (Frontiers in AI, 2026).
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, RefreshCw, AlertTriangle, Clock,
  TrendingDown, MessageSquare, BookOpen, Zap,
  ChevronDown, Shield,
} from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { clsx } from 'clsx'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: 'easeOut' },
})

// ── Timeline step ──────────────────────────────
function TimelineStep({ step, index, color, isDark, total }) {
  const [open, setOpen] = useState(false)
  const isLast = index === total - 1
  const textMuted = isDark ? 'text-white/40' : 'text-black/50'
  const textMain  = isDark ? 'text-white' : 'text-black'

  return (
    <div className="flex gap-3">
      {/* Line + dot */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center z-10 flex-shrink-0"
          style={{ background: `${color}20`, border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}44` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        </div>
        {!isLast && (
          <div className="flex-1 w-px mt-1" style={{ background: `${color}28`, minHeight: 24 }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full text-left flex items-center justify-between gap-2 group"
        >
          <div>
            <span className={clsx('text-xs font-bold', textMain)}>{step.label}</span>
            <span className="ml-2 text-[0.58rem] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color, background: `${color}14` }}>
              {step.time}
            </span>
          </div>
          <ChevronDown size={12} style={{ color, flexShrink: 0 }}
            className={clsx('transition-transform', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className={clsx('text-[0.65rem] leading-relaxed mt-1.5 overflow-hidden', textMuted)}
            >
              {step.detail}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Stat tile ──────────────────────────────────
function StatTile({ label, value, color, isDark }) {
  return (
    <div className="rounded-xl p-3 text-center"
      style={{ background: `${color}0c`, border: `1px solid ${color}22` }}>
      <div className="text-xl font-black" style={{ color, textShadow: `0 0 10px ${color}66` }}>{value}</div>
      <div className={clsx('text-[0.55rem] font-semibold mt-0.5 leading-tight', isDark ? 'text-white/40' : 'text-black/45')}>{label}</div>
    </div>
  )
}

// ── Column ─────────────────────────────────────
function ChurnColumn({ title, accentColor, causes, timeline, stats, source, icon: ColIcon, delay, isDark, t }) {
  const textMuted = isDark ? 'text-white/40' : 'text-black/50'
  const textMain  = isDark ? 'text-white'    : 'text-black'

  return (
    <motion.div {...fadeUp(delay)} className="flex-1 min-w-0">
      <div className="rounded-2xl h-full"
        style={{
          background: isDark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)',
          border: `1px solid ${accentColor}28`,
          borderTop: `2px solid ${accentColor}`,
        }}>

        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}28` }}>
              <ColIcon size={17} style={{ color: accentColor }} />
            </div>
            <div>
              <h3 className={clsx('text-base font-black', textMain)}>{title}</h3>
              <p className={clsx('text-[0.58rem]', textMuted)}>{t.churnSplit.strategyPlaybook}</p>
            </div>
          </div>

          {/* Root causes */}
          <div className="flex flex-wrap gap-1.5">
            {causes.map(c => (
              <span key={c} className="text-[0.55rem] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20`, color: accentColor }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Stat tiles */}
        <div className="px-5 py-4 grid grid-cols-2 gap-2 border-b"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          {stats.map(s => <StatTile key={s.label} {...s} color={accentColor} isDark={isDark} />)}
        </div>

        {/* Timeline */}
        <div className="p-5">
          <p className={clsx('text-[0.58rem] font-bold tracking-widest uppercase mb-3', textMuted)}>
            {t.churnSplit.recoveryTimeline}
          </p>
          {timeline.map((step, i) => (
            <TimelineStep
              key={i}
              step={step}
              index={i}
              total={timeline.length}
              color={accentColor}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Source */}
        <div className="px-5 pb-4">
          <p className={clsx('text-[0.52rem] italic', textMuted)}>
            {source}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────
export default function ChurnSplitView() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const textMuted = isDark ? 'text-white/40' : 'text-black/50'
  const textMain  = isDark ? 'text-white'    : 'text-black'

  const involuntaryTimeline = [
    { label: t.churnSplit.invStep1, time: '0h',  detail: t.churnSplit.invStep1Detail },
    { label: t.churnSplit.invStep2, time: '1h',  detail: t.churnSplit.invStep2Detail },
    { label: t.churnSplit.invStep3, time: '24h', detail: t.churnSplit.invStep3Detail },
    { label: t.churnSplit.invStep4, time: '48h', detail: t.churnSplit.invStep4Detail },
    { label: t.churnSplit.invStep5, time: '72h', detail: t.churnSplit.invStep5Detail },
  ]

  const voluntaryTimeline = [
    { label: t.churnSplit.volStep1, time: 'Day 0',  detail: t.churnSplit.volStep1Detail },
    { label: t.churnSplit.volStep2, time: 'Day 1',  detail: t.churnSplit.volStep2Detail },
    { label: t.churnSplit.volStep3, time: 'Day 3',  detail: t.churnSplit.volStep3Detail },
    { label: t.churnSplit.volStep4, time: 'Day 7',  detail: t.churnSplit.volStep4Detail },
    { label: t.churnSplit.volStep5, time: 'Day 14', detail: t.churnSplit.volStep5Detail },
  ]

  return (
    <div>
      {/* Section header */}
      <motion.div {...fadeUp(0)} className="mb-5">
        <h2 className={clsx('text-xl font-black', textMain)}>{t.churnSplit.title}</h2>
        <p className={clsx('text-xs mt-0.5', textMuted)}>
          {t.churnSplit.sub}
        </p>
      </motion.div>

      {/* Two columns + divider */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <ChurnColumn
          title={t.churnSplit.involuntaryTitle}
          accentColor="#00e5ff"
          icon={CreditCard}
          causes={[t.churnSplit.cause1, t.churnSplit.cause2, t.churnSplit.cause3, t.churnSplit.cause4]}
          stats={[
            { label: t.churnSplit.invStat1Label, value: '68%' },
            { label: t.churnSplit.invStat2Label, value: '23%' },
            { label: t.churnSplit.invStat3Label, value: '$1.2M' },
            { label: t.churnSplit.invStat4Label, value: '72h' },
          ]}
          timeline={involuntaryTimeline}
          source={t.churnSplit.invSource}
          delay={0.1}
          isDark={isDark}
          t={t}
        />

        {/* Divider */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-3 px-2 flex-shrink-0">
          <div className="flex-1 w-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
            <Shield size={16} style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
          </div>
          <div className="flex-1 w-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
        </div>

        <ChurnColumn
          title={t.churnSplit.voluntaryTitle}
          accentColor="#ff0055"
          icon={TrendingDown}
          causes={[t.churnSplit.cause5, t.churnSplit.cause6, t.churnSplit.cause7, t.churnSplit.cause8]}
          stats={[
            { label: t.churnSplit.volStat1Label, value: '41%' },
            { label: t.churnSplit.volStat2Label, value: '90d' },
            { label: t.churnSplit.volStat3Label, value: '−22%' },
            { label: t.churnSplit.volStat4Label, value: '84%' },
          ]}
          timeline={voluntaryTimeline}
          source={t.churnSplit.volSource}
          delay={0.18}
          isDark={isDark}
          t={t}
        />
      </div>
    </div>
  )
}
