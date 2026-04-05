/**
 * Model.jsx — Model Performance page
 * Technical page: metrics, threshold optimizer, ROI calculator.
 * Ensemble: XGBoost + LightGBM + GradientBoosting (Soft Voting).
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, Target, Zap, BarChart2, Activity } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentAlpha, accentTextShadow } from '../lib/theme'
import { fetchModelMetrics } from '../services/api'
import { clsx } from 'clsx'
import ThresholdOptimizer from '../components/ThresholdOptimizer'
import ROICalculator from '../components/ROICalculator'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.42, ease: 'easeOut' },
})

function Card({ children, className = '', glowColor }) {
  const { isDark } = useTheme()
  return (
    <div className={clsx(
      'rounded-2xl border backdrop-blur-xl transition-colors duration-300',
      isDark ? 'bg-[rgba(10,10,10,0.82)] border-white/[0.07]' : 'bg-white/82 border-black/[0.07]',
      className,
    )}
      style={{ boxShadow: glowColor ? `0 0 32px ${glowColor}10` : undefined }}>
      {children}
    </div>
  )
}

// ── Metric card ─────────────────────────────────
function MetricCard({ label, value, sub, color, icon: Icon, bar, delay }) {
  const { isDark } = useTheme()
  const textMuted = isDark ? 'text-white/35' : 'text-black/40'
  return (
    <motion.div {...fadeUp(delay)}>
      <Card glowColor={color}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={clsx('text-[0.58rem] font-bold tracking-[0.16em] uppercase', textMuted)}>
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
          {sub && <p className={clsx('text-[0.62rem]', textMuted)}>{sub}</p>}
          {bar != null && (
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

// ── Default metrics (used until API responds) ───
const DEFAULT_METRICS = {
  accuracy:          0.84,
  precision:         0.84,
  recall:            0.84,
  f1_score:          0.84,
  auc_roc:           0.932,
  brier_score:       0.142,
  optimal_threshold: 0.528,
  model_type:        'XGBoost + LightGBM + GradientBoosting (Soft Voting)',
  smote_applied:     true,
  calibration_method: 'isotonic',
  training_samples:  5634,
  test_samples:      1409,
}

export default function Model() {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const accent    = getAccent(isDark)
  const textMuted = isDark ? 'text-white/40' : 'text-black/45'
  const textMain  = isDark ? 'text-white'    : 'text-black'

  const [metrics, setMetrics] = useState(DEFAULT_METRICS)

  useEffect(() => {
    fetchModelMetrics().then(m => { if (m) setMetrics(m) })
  }, [])

  const metricCards = [
    { label: t.model.accuracy,    value: (metrics.accuracy * 100).toFixed(1) + '%', sub: t.model.accuracySub,   color: '#ccff00', icon: Target,   bar: Math.round(metrics.accuracy * 100) },
    { label: t.model.precision,   value: (metrics.precision * 100).toFixed(1) + '%', sub: t.model.precisionSub, color: '#00e5ff', icon: TrendingUp, bar: Math.round(metrics.precision * 100) },
    { label: t.model.recall,      value: (metrics.recall * 100).toFixed(1) + '%', sub: t.model.recallSub,       color: '#ff8800', icon: Activity,  bar: Math.round(metrics.recall * 100) },
    { label: t.model.f1Score,     value: metrics.f1_score.toFixed(3), sub: t.model.f1Sub,                        color: '#ccff00', icon: Zap,       bar: Math.round(metrics.f1_score * 100) },
    { label: t.model.aucRoc,      value: metrics.auc_roc.toFixed(3), sub: t.model.aucRocSub,                    color: '#8800ff', icon: BarChart2, bar: Math.round(metrics.auc_roc * 100) },
    { label: t.model.brierScore,  value: metrics.brier_score.toFixed(3), sub: t.model.brierSub,                 color: '#00e5ff', icon: Brain,     bar: null },
  ]

  return (
    <div className="space-y-8 md:space-y-10">

      {/* ── Header ─────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: accent, boxShadow: `0 0 20px ${accent}44` }}>
            <Brain size={20} color={isDark ? '#000' : '#fff'} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={clsx('text-3xl md:text-4xl font-black leading-tight', textMain)}>
              {t.model.pageTitle + ' '}
              <span style={{ color: accent, textShadow: accentTextShadow(isDark) }}>{t.model.pageTitleAccent}</span>
            </h1>
            <p className={clsx('text-sm mt-1', textMuted)}>
              {metrics.model_type}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {[
            metrics.smote_applied && 'SMOTE',
            metrics.calibration_method && (t.model.calibration + ': ' + metrics.calibration_method),
            t.model.train + ': ' + (metrics.training_samples ?? 5634).toLocaleString(),
            t.model.test + ': ' + (metrics.test_samples ?? 1409).toLocaleString(),
          ].filter(Boolean).map(badge => (
            <span key={badge} className="text-[0.58rem] font-bold px-2.5 py-1 rounded-lg"
              style={{ background: accentAlpha(isDark, 0.1), border: `1px solid ${accentAlpha(isDark, 0.25)}`, color: accent }}>
              {badge}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Model Metrics Grid ─────────────────────── */}
      <section>
        <motion.div {...fadeUp(0.06)} className="mb-4">
          <h2 className={clsx('text-xl font-black', textMain)}>{t.model.performanceMetrics}</h2>
          <p className={clsx('text-xs mt-0.5', textMuted)}>
            {t.model.evaluatedOn + ': ' + metrics.optimal_threshold}
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          {metricCards.map((m, i) => (
            <MetricCard key={m.label} {...m} delay={0.10 + i * 0.06} />
          ))}
        </div>

        {/* Info strip */}
        <motion.div {...fadeUp(0.48)} className="mt-3">
          <Card>
            <div className="px-5 py-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: accent, boxShadow: `0 0 5px ${accent}` }} />
                <span className={clsx('text-xs font-semibold', textMain)}>
                  {t.model.ensemble}
                </span>
              </div>
              {[
                [t.model.optimalThreshold, metrics.optimal_threshold],
                [t.model.featureSelection, t.model.borutaDomain],
                [t.model.explainability, t.model.shapTreeExplainer],
                [t.model.oversampling, 'SMOTE'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className={clsx('text-[0.6rem]', textMuted)}>{k}:</span>
                  <span className="text-[0.6rem] font-bold" style={{ color: accent }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ── Threshold Optimizer ────────────────────── */}
      <motion.section {...fadeUp(0.38)}>
        <Card className="p-5 md:p-6">
          <ThresholdOptimizer />
        </Card>
      </motion.section>

      {/* ── ROI Calculator ────────────────────────── */}
      <motion.section {...fadeUp(0.44)}>
        <Card className="p-5 md:p-6">
          <ROICalculator />
        </Card>
      </motion.section>

      {/* ── Source footnote ────────────────────────── */}
      <motion.div {...fadeUp(0.50)}>
        <p className={clsx('text-center text-[0.6rem] italic', textMuted)}>
          {t.model.methodologySource}
        </p>
      </motion.div>
    </div>
  )
}
