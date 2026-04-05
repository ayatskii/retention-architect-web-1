import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, AlertTriangle, CreditCard, Activity, Shield,
  TrendingDown, Clock, Users, Eye, Clock3, Check, ChevronDown,
  ChevronUp, Play, Calendar, UserPlus, CalendarCheck,
  Crosshair, Bell, Wrench, CheckCircle2, Circle,
} from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentAlpha, accentGlow, accentTextShadow, accentFg } from '../lib/theme'
import { TASK_DATA } from '../data/taskData'
import { clsx } from 'clsx'

// ─── helpers ──────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: 'easeOut' },
})

const ICON_MAP = {
  CreditCard, AlertTriangle, Activity, Shield, TrendingDown, Clock, Users, Eye, Clock3,
}

const sevCfg = {
  critical: { color: '#ff0055', bg: 'rgba(255,0,85,0.08)',   border: 'rgba(255,0,85,0.22)' },
  high:     { color: '#ff8800', bg: 'rgba(255,136,0,0.08)',  border: 'rgba(255,136,0,0.22)' },
  review:   { color: '#ccff00', bg: 'rgba(204,255,0,0.08)',  border: 'rgba(204,255,0,0.22)' },
}

const typeCfg = {
  detection:    { icon: Crosshair,    color: '#00ccff' },
  alert:        { icon: Bell,         color: '#ff8800' },
  intervention: { icon: Wrench,       color: '#ccff00' },
}

// ─── sub-components ───────────────────────────
function Card({ children, className = '', glowColor, style = {} }) {
  const { isDark } = useTheme()
  return (
    <div
      className={clsx(
        'rounded-2xl backdrop-blur-xl transition-colors duration-300',
        isDark ? 'bg-[rgba(10,10,10,0.8)] border border-white/[0.07]' : 'bg-white/80 border border-black/[0.07]',
        className,
      )}
      style={{ boxShadow: glowColor ? `0 0 32px ${glowColor}14` : undefined, ...style }}
    >
      {children}
    </div>
  )
}

function NeonDot({ cx, cy, payload, severityColor }) {
  const { isDark } = useTheme()
  if (!cx || !cy) return null
  const isAffected = payload.a === 1
  const r = isAffected ? 6 : 3.5
  const color = isAffected ? severityColor : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)')
  return (
    <g>
      {isAffected && (
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={severityColor} strokeOpacity={0.25} strokeWidth={1.5} />
      )}
      <circle cx={cx} cy={cy} r={r} fill={color}
        style={isAffected ? { filter: `drop-shadow(0 0 4px ${severityColor}88)` } : {}} />
    </g>
  )
}

function ScatterTooltip({ active, payload, isDark, td }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={clsx('rounded-xl p-3 text-xs', isDark ? 'bg-[#111] border border-white/10' : 'bg-white border border-black/10')}>
      <p className="font-bold">{td.engagement}: {d.x.toFixed(1)}</p>
      <p className="font-bold">{td.paymentStability}: {d.y.toFixed(2)}</p>
      <p className={isDark ? 'text-white/40' : 'text-black/40'}>
        {d.a ? td.affectedSegment : td.contextUsers}
      </p>
    </div>
  )
}

// ─── main component ───────────────────────────
export default function TaskDetail({ onNavigate, activeTaskId }) {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const accent = getAccent(isDark)
  const fg = accentFg(isDark)

  const td = t.taskDetail || {}
  const task = TASK_DATA[activeTaskId]

  // Local interactive state
  const [strategyChoice, setStrategyChoice] = useState(null)
  const [applied, setApplied] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [assignee, setAssignee] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [confidenceOpen, setConfidenceOpen] = useState(false)

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className={isDark ? 'text-white/40' : 'text-black/40'}>Task not found</p>
        <button onClick={() => onNavigate('overview')} className="mt-4 text-sm font-bold" style={{ color: accent }}>
          ← {td.backToOverview || 'Back to Overview'}
        </button>
      </div>
    )
  }

  const sev = sevCfg[task.severity] || sevCfg.review
  const textMuted = isDark ? 'text-white/35' : 'text-black/40'
  const textMain = isDark ? 'text-white' : 'text-black'
  const inputCls = clsx(
    'w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none transition-all border',
    isDark
      ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/20'
      : 'bg-black/[0.03] border-black/[0.08] text-black placeholder:text-black/25 focus:border-black/20',
  )

  const taskTitle = t.tasks?.[`task${activeTaskId}Title`] || `Task #${activeTaskId}`
  const taskTag = t.tasks?.[`task${activeTaskId}Tag`] || task.severity.toUpperCase()

  // Separate affected vs context points for the scatter
  const affectedPts = task.segment.points.filter(p => p.a === 1)
  const contextPts = task.segment.points.filter(p => p.a === 0)

  return (
    <div className="space-y-8 md:space-y-10">

      {/* ═══ SECTION 1 — HEADER ═══════════════════════ */}
      <motion.section {...fadeUp(0)}>
        <div
          className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background: isDark
              ? `linear-gradient(135deg,${sev.color}14,rgba(0,0,0,0))`
              : `linear-gradient(135deg,${sev.color}1a,rgba(255,255,255,0))`,
            border: `1px solid ${sev.border}`,
            boxShadow: `0 0 40px ${sev.color}10`,
          }}
        >
          {/* Ambient glow */}
          <div className="absolute right-0 top-0 w-48 h-48 opacity-[0.06]"
            style={{ background: `radial-gradient(circle,${sev.color},transparent 70%)` }} />

          <div className="relative z-10">
            {/* Back button */}
            <button
              onClick={() => onNavigate('overview')}
              className={clsx('flex items-center gap-1.5 text-xs font-semibold mb-5 transition-colors',
                isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black')}
            >
              <ArrowLeft size={14} />
              {td.backToOverview || 'Back to Overview'}
            </button>

            {/* Title row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${sev.color}18` }}>
                {(() => { const Icon = ICON_MAP[task.iconKey] || Activity; return <Icon size={20} style={{ color: sev.color }} /> })()}
              </div>
              <h1 className={clsx('text-2xl md:text-3xl font-black', textMain)}>
                {taskTitle}
              </h1>
              <span className="text-[0.6rem] font-black px-2.5 py-1 rounded-lg tracking-widest"
                style={{
                  color: task.severity === 'review' ? '#000' : sev.color,
                  background: sev.bg,
                  border: `1px solid ${sev.border}`,
                }}>
                {taskTag}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-2">
              <div>
                <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-1', textMuted)}>
                  {td.churnType || 'Churn Type'}
                </p>
                <span className="text-sm font-black px-3 py-1 rounded-lg"
                  style={{
                    background: task.churnType === 'involuntary' ? 'rgba(255,0,85,0.1)' : 'rgba(255,136,0,0.1)',
                    color: task.churnType === 'involuntary' ? '#ff0055' : '#ff8800',
                    border: `1px solid ${task.churnType === 'involuntary' ? 'rgba(255,0,85,0.25)' : 'rgba(255,136,0,0.25)'}`,
                  }}>
                  {td[task.churnType] || task.churnType}
                </span>
              </div>
              <div>
                <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-1', textMuted)}>
                  {td.affectedUsers || 'Affected Users'}
                </p>
                <p className="text-xl font-black" style={{ color: sev.color, textShadow: `0 0 14px ${sev.color}66` }}>
                  {task.affectedUsers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-1', textMuted)}>
                  {td.revenueAtRisk || 'Revenue at Risk'}
                </p>
                <p className="text-xl font-black" style={{ color: '#ff0055', textShadow: '0 0 14px rgba(255,0,85,0.6)' }}>
                  ${(task.revenueAtRisk / 1_000_000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ SECTION 2 — ROOT CAUSE ═══════════════════ */}
      <motion.section {...fadeUp(0.1)}>
        <Card>
          <div className="p-5 md:p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>
              {td.rootCauseTitle || 'Root Cause Analysis'}
            </h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>
              {td.rootCauseSub || 'Top contributing factors from the ML model'}
            </p>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': isDark ? '0.04' : '0.06' }}>
            {task.rootCauses.map((cause, i) => {
              const Icon = ICON_MAP[cause.iconKey] || Activity
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="p-5 md:p-6 flex items-start gap-4"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${sev.color}12` }}>
                    <Icon size={18} style={{ color: sev.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx('text-sm font-bold', textMain)}>{cause.factor}</span>
                      <span className="text-xs font-black ml-2" style={{ color: sev.color }}>
                        {(cause.contribution * 100).toFixed(0)}% {td.contribution || 'contribution'}
                      </span>
                    </div>
                    <p className={clsx('text-xs leading-relaxed mb-2', textMuted)}>
                      {td[cause.explanationKey] || cause.factor}
                    </p>
                    <div className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cause.contribution * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: sev.color, boxShadow: `0 0 8px ${sev.color}66` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      </motion.section>

      {/* ═══ SECTION 3 — SEGMENT SNAPSHOT ═════════════ */}
      <motion.section {...fadeUp(0.18)}>
        <Card>
          <div className="p-5 md:p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>
              {td.segmentTitle || 'User Segment Snapshot'}
            </h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>
              {td.segmentSub || 'Affected users on engagement vs payment stability axes'}
            </p>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Scatter chart */}
              <div className="lg:col-span-3">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
                    />
                    <XAxis
                      type="number" dataKey="x" name="engagement"
                      tick={{ fontSize: 10, fill: isDark ? '#555' : '#999' }}
                      label={{ value: td.engagement || 'Engagement', position: 'bottom', offset: -2, fontSize: 10, fill: isDark ? '#555' : '#999' }}
                    />
                    <YAxis
                      type="number" dataKey="y" name="stability"
                      tick={{ fontSize: 10, fill: isDark ? '#555' : '#999' }}
                      label={{ value: td.paymentStability || 'Payment Stability', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: isDark ? '#555' : '#999' }}
                    />
                    <ReTooltip content={<ScatterTooltip isDark={isDark} td={td} />} />
                    <Scatter
                      data={contextPts}
                      shape={(props) => <NeonDot {...props} severityColor={sev.color} />}
                    />
                    <Scatter
                      data={affectedPts}
                      shape={(props) => <NeonDot {...props} severityColor={sev.color} />}
                    />
                  </ScatterChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 ml-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: sev.color, boxShadow: `0 0 6px ${sev.color}88` }} />
                    <span className={clsx('text-[0.6rem] font-bold', textMuted)}>{td.affectedSegment || 'Affected'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }} />
                    <span className={clsx('text-[0.6rem] font-bold', textMuted)}>{td.contextUsers || 'Context'}</span>
                  </div>
                </div>
              </div>

              {/* Stats tiles */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                {[
                  { label: td.avgLtv || 'Avg LTV', value: `$${task.segment.avgLtv}`, color: accent },
                  { label: td.avgSessionFreq || 'Avg Sessions/Week', value: task.segment.avgSessionFreq.toFixed(1), color: '#00ccff' },
                  { label: td.daysSincePayment || 'Days Since Payment', value: task.segment.daysSincePayment, color: '#ff8800' },
                  { label: td.paymentFailureRate || 'Failure Rate', value: `${(task.segment.paymentFailureRate * 100).toFixed(0)}%`, color: '#ff0055' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'rounded-xl p-4 border',
                      isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]',
                    )}
                  >
                    <p className={clsx('text-[0.58rem] font-bold tracking-widest uppercase mb-2', textMuted)}>
                      {stat.label}
                    </p>
                    <p className="text-xl font-black" style={{ color: stat.color, textShadow: `0 0 12px ${stat.color}44` }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══ SECTION 4 — RECOMMENDED STRATEGY ═════════ */}
      <motion.section {...fadeUp(0.24)}>
        <Card glowColor={accent}>
          <div className="p-5 md:p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>
              {td.strategyTitle || 'Recommended Strategy'}
            </h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>
              {td.strategySub || 'Auto-suggested from Strategy Lab analysis'}
            </p>
          </div>

          <div className="p-5 md:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-black mb-2" style={{ color: accent, textShadow: accentTextShadow(isDark) }}>
                {td[task.strategy.nameKey] || task.strategy.nameKey}
              </h3>
              <p className={clsx('text-sm leading-relaxed', textMuted)}>
                {td[task.strategy.descKey] || task.strategy.descKey}
              </p>
              <p className={clsx('text-xs mt-2', isDark ? 'text-white/20' : 'text-black/20')}>
                {td.source || 'Source'}: {task.strategy.source}
              </p>
            </div>

            {/* Recovery metrics */}
            <div className="flex flex-wrap gap-8 mb-6">
              <div>
                <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-1', textMuted)}>
                  {td.expectedRecovery || 'Expected Recovery Rate'}
                </p>
                <p className="text-2xl font-black" style={{ color: accent, textShadow: accentTextShadow(isDark) }}>
                  +{(task.strategy.expectedRecovery * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className={clsx('text-[0.6rem] font-bold tracking-widest uppercase mb-1', textMuted)}>
                  {td.projectedRevenue || 'Projected Revenue Recovery'}
                </p>
                <p className="text-2xl font-black" style={{ color: accent, textShadow: accentTextShadow(isDark) }}>
                  ${(task.strategy.projectedRevenue / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            {/* Accept / Modify / Reject */}
            {strategyChoice ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{
                  background: strategyChoice === 'accept' ? `${accent}18`
                    : strategyChoice === 'modify' ? 'rgba(0,204,255,0.1)'
                    : 'rgba(255,0,85,0.1)',
                  border: `1px solid ${strategyChoice === 'accept' ? `${accent}40`
                    : strategyChoice === 'modify' ? 'rgba(0,204,255,0.3)'
                    : 'rgba(255,0,85,0.3)'}`,
                }}
              >
                <Check size={16} style={{
                  color: strategyChoice === 'accept' ? accent
                    : strategyChoice === 'modify' ? '#00ccff'
                    : '#ff0055',
                }} />
                <span className="text-sm font-bold" style={{
                  color: strategyChoice === 'accept' ? accent
                    : strategyChoice === 'modify' ? '#00ccff'
                    : '#ff0055',
                }}>
                  {td[strategyChoice === 'accept' ? 'accepted' : strategyChoice === 'modify' ? 'modified' : 'rejected']
                    || (strategyChoice === 'accept' ? 'Strategy Accepted' : strategyChoice === 'modify' ? 'Modification Requested' : 'Strategy Rejected')}
                </span>
                <button
                  onClick={() => setStrategyChoice(null)}
                  className={clsx('ml-auto text-xs font-semibold', textMuted)}
                >
                  undo
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setStrategyChoice('accept')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg"
                  style={{ background: accent, color: fg, boxShadow: accentGlow(isDark, 'sm') }}
                >
                  {td.accept || 'Accept'}
                </button>
                <button
                  onClick={() => setStrategyChoice('modify')}
                  className={clsx(
                    'px-5 py-2.5 rounded-xl text-sm font-bold transition-all border',
                    isDark ? 'border-white/15 text-white/60 hover:text-white hover:border-white/30' : 'border-black/15 text-black/60 hover:text-black hover:border-black/30',
                  )}
                >
                  {td.modify || 'Modify'}
                </button>
                <button
                  onClick={() => setStrategyChoice('reject')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all border"
                  style={{ borderColor: 'rgba(255,0,85,0.3)', color: '#ff0055' }}
                >
                  {td.reject || 'Reject'}
                </button>
              </div>
            )}
          </div>
        </Card>
      </motion.section>

      {/* ═══ SECTION 5 — ACTION PANEL ═════════════════ */}
      <motion.section {...fadeUp(0.3)}>
        <Card>
          <div className="p-5 md:p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>
              {td.actionTitle || 'Action Panel'}
            </h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>
              {td.actionSub || 'Configure and deploy the intervention'}
            </p>
          </div>

          <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Apply strategy */}
            <div className={clsx('rounded-xl p-4 border', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
              <div className="flex items-center gap-2 mb-3">
                <Play size={14} style={{ color: accent }} />
                <span className={clsx('text-xs font-bold', textMain)}>
                  {td.applyStrategy || 'Apply Strategy to Segment'}
                </span>
              </div>
              <button
                onClick={() => setApplied(true)}
                disabled={applied}
                className={clsx(
                  'w-full py-2.5 rounded-xl text-sm font-bold transition-all',
                  applied
                    ? isDark ? 'bg-white/[0.06] text-white/30' : 'bg-black/[0.04] text-black/30'
                    : 'hover:shadow-lg',
                )}
                style={!applied ? { background: accent, color: fg, boxShadow: accentGlow(isDark, 'sm') } : {}}
              >
                {applied ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check size={14} /> {td.applied || 'Applied'}
                  </span>
                ) : (
                  td.applyStrategy || 'Apply Strategy'
                )}
              </button>
            </div>

            {/* Schedule intervention */}
            <div className={clsx('rounded-xl p-4 border', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: '#00ccff' }} />
                <span className={clsx('text-xs font-bold', textMain)}>
                  {td.scheduleIntervention || 'Schedule Intervention'}
                </span>
              </div>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Assign to team */}
            <div className={clsx('rounded-xl p-4 border', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={14} style={{ color: '#ff8800' }} />
                <span className={clsx('text-xs font-bold', textMain)}>
                  {td.assignTeam || 'Assign to Team Member'}
                </span>
              </div>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Sarah Chen"
                className={inputCls}
              />
            </div>

            {/* Follow-up date */}
            <div className={clsx('rounded-xl p-4 border', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck size={14} style={{ color: '#8800ff' }} />
                <span className={clsx('text-xs font-bold', textMain)}>
                  {td.setFollowUp || 'Set Follow-up Date'}
                </span>
              </div>
              <input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══ SECTION 6 — TIMELINE / AUDIT LOG ═════════ */}
      <motion.section {...fadeUp(0.36)}>
        <Card>
          <div className="p-5 md:p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>
              {td.timelineTitle || 'Timeline / Audit Log'}
            </h2>
            <p className={clsx('text-xs mt-0.5', textMuted)}>
              {td.timelineSub || 'History of detections and interventions for this segment'}
            </p>
          </div>

          <div className="p-5 md:p-6">
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-[15px] top-2 bottom-2 w-px"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
              />

              <div className="space-y-6">
                {task.timeline.map((ev, i) => {
                  const cfg = typeCfg[ev.type] || typeCfg.detection
                  const Icon = cfg.icon
                  const dateStr = new Date(ev.date).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-start gap-4 pl-0"
                    >
                      {/* Node */}
                      <div
                        className="flex-shrink-0 w-[31px] h-[31px] rounded-full flex items-center justify-center z-10"
                        style={{ background: isDark ? '#0a0a0a' : '#f8fafc', border: `2px solid ${cfg.color}55` }}
                      >
                        <Icon size={13} style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center flex-wrap gap-2 mb-0.5">
                          <span className="text-[0.58rem] font-black tracking-widest uppercase px-2 py-0.5 rounded"
                            style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}30` }}>
                            {td[ev.type] || ev.type}
                          </span>
                          <span className={clsx('text-[0.6rem]', textMuted)}>{dateStr}</span>
                        </div>
                        <p className={clsx('text-sm', textMain)}>
                          {td[ev.eventKey] || ev.eventKey}
                        </p>
                        {ev.outcome && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <CheckCircle2 size={12} style={{ color: accent }} />
                            <span className="text-xs font-bold" style={{ color: accent }}>
                              {td.outcome || 'Outcome'}: {ev.outcome}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══ SECTION 7 — MODEL CONFIDENCE FOOTER ══════ */}
      <motion.section {...fadeUp(0.42)}>
        <Card>
          <div className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={clsx('text-lg md:text-xl font-black', textMain)}>
                  {td.confidenceTitle || 'Model Confidence'}
                </h2>
                <p className={clsx('text-xs mt-0.5', textMuted)}>
                  {td.confidenceSub || 'Prediction quality metrics for this classification'}
                </p>
              </div>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: td.f1Score || 'F1 Score', value: task.model.f1.toFixed(2), color: accent },
                { label: td.precision || 'Precision', value: task.model.precision.toFixed(2), color: '#00ccff' },
                { label: td.recall || 'Recall', value: task.model.recall.toFixed(2), color: '#ff8800' },
              ].map((m, i) => (
                <div
                  key={i}
                  className={clsx(
                    'rounded-xl p-4 text-center border',
                    isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]',
                  )}
                >
                  <p className={clsx('text-[0.58rem] font-bold tracking-widest uppercase mb-2', textMuted)}>
                    {m.label}
                  </p>
                  <p className="text-2xl font-black" style={{ color: m.color, textShadow: `0 0 12px ${m.color}44` }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Expandable explanation */}
            <button
              onClick={() => setConfidenceOpen(v => !v)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border',
                isDark ? 'border-white/[0.08] hover:border-white/15 text-white/50' : 'border-black/[0.08] hover:border-black/15 text-black/50',
              )}
            >
              {td.whyThisRank || 'Why this priority rank?'}
              {confidenceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {confidenceOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className={clsx(
                    'mt-3 p-4 rounded-xl text-sm leading-relaxed border',
                    isDark ? 'bg-white/[0.02] border-white/[0.06] text-white/60' : 'bg-black/[0.02] border-black/[0.06] text-black/60',
                  )}>
                    {td[task.model.explanationKey] || task.model.explanationKey}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.section>
    </div>
  )
}
