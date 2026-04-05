/**
 * Segments.jsx — User Risk Segmentation page
 * Shows WHO is churning (K-Means clusters) and WHY (Voluntary vs Involuntary split).
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentTextShadow } from '../lib/theme'
import { clsx } from 'clsx'
import { fetchSegments } from '../services/api'
import RiskSegmentation from '../components/RiskSegmentation'
import ChurnSplitView from '../components/ChurnSplitView'

// Map the backend /segments payload (snake_case + dominant_churn_type string)
// into the shape RiskSegmentation expects (camelCase + icon component + title-cased type).
const ICONS_BY_NAME = {
  'High-Risk':   AlertTriangle,
  'Medium-Risk': Activity,
  'Low-Risk':    CheckCircle2,
}
function adaptClusters(payload) {
  if (!payload?.clusters) return null
  return payload.clusters.map(c => ({
    name:         c.name,
    churnRate:    Math.round((c.churn_rate ?? 0) * 100),
    users:        c.user_count ?? 0,
    avgTenure:    `${(c.avg_tenure_days ?? 0).toFixed(1)} days`,
    avgSpend:     `$${(c.avg_spend ?? 0).toFixed(2)}`,
    color:        c.color ?? '#ccff00',
    icon:         ICONS_BY_NAME[c.name] ?? Activity,
    // Prefer the backend-supplied display label; fall back to a
    // title-cased version of the raw enum if the label is missing.
    dominantType: c.dominant_churn_type_label
                  ?? ((c.dominant_churn_type ?? 'mixed').charAt(0).toUpperCase() + (c.dominant_churn_type ?? 'mixed').slice(1)),
  }))
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: 'easeOut' },
})

function Card({ children, className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={clsx(
      'rounded-2xl border backdrop-blur-xl transition-colors duration-300',
      isDark ? 'bg-[rgba(10,10,10,0.82)] border-white/[0.07]' : 'bg-white/82 border-black/[0.07]',
      className,
    )}>
      {children}
    </div>
  )
}

export default function Segments() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const accent    = getAccent(isDark)
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'

  const [clusters, setClusters] = useState(null)
  useEffect(() => {
    fetchSegments().then(data => setClusters(adaptClusters(data))).catch(() => {})
  }, [])

  return (
    <div className="space-y-8 md:space-y-10">

      {/* ── Header ─────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: accent, boxShadow: `0 0 20px ${accent}44` }}>
          <Users size={20} color={isDark ? '#000' : '#fff'} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className={clsx('text-3xl md:text-4xl font-black leading-tight', textMain)}>
            {t.segments.pageTitle + ' '}
            <span style={{ color: accent, textShadow: accentTextShadow(isDark) }}>{t.segments.pageTitleAccent}</span>
          </h1>
          <p className={clsx('text-sm mt-1', textMuted)}>
            {t.segments.pageSub}
          </p>
        </div>
      </motion.div>

      {/* ── Risk Segmentation ──────────────────────── */}
      <motion.section {...fadeUp(0.08)}>
        <Card className="p-5 md:p-6">
          <RiskSegmentation clusters={clusters} />
        </Card>
      </motion.section>

      {/* ── Section divider ────────────────────────── */}
      <motion.div {...fadeUp(0.16)} className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
        <div>
          <p className={clsx('text-base font-black text-center', textMain)}>{t.segments.retentionTitle}</p>
          <p className={clsx('text-xs text-center mt-0.5', textMuted)}>{t.segments.retentionSub}</p>
        </div>
        <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
      </motion.div>

      {/* ── Churn Split View ───────────────────────── */}
      <motion.section {...fadeUp(0.22)}>
        <Card className="p-5 md:p-6">
          <ChurnSplitView />
        </Card>
      </motion.section>
    </div>
  )
}
