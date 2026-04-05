import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, AlertTriangle, CheckCircle, XCircle,
  Zap, Clock, CreditCard, Activity, Shield,
} from 'lucide-react'
import { useI18n } from '../context/I18nContext'

const mockUsers = {
  'USR-001': {
    id: 'USR-001', name: 'Aisha Bekova', plan: 'Professional',
    riskScore: 87, riskLevel: 'CRITICAL', riskColor: '#ff0055',
    churnType: 'Involuntary', lastActive: '2 hours ago',
    factors: [
      { icon: CreditCard, label: 'Payment failure',     detail: 'Active but payment failed 3 times in last 14 days', severity: 'critical' },
      { icon: Clock,      label: 'Session length drop', detail: 'Avg session time dropped 62% over past 7 days',       severity: 'warning'  },
      { icon: Activity,   label: 'Feature usage decline',detail: 'Core feature engagement down 45% month-over-month',  severity: 'warning'  },
      { icon: AlertTriangle, label: 'Support ticket open', detail: 'Unresolved billing dispute ticket #TK-8821',       severity: 'critical' },
    ],
    recommendation: 'Immediate automated payment retry + CSM outreach within 24h. Offer 2-month discount to neutralise billing friction.',
  },
  'USR-002': {
    id: 'USR-002', name: 'Damir Seitkali', plan: 'Starter',
    riskScore: 41, riskLevel: 'MODERATE', riskColor: '#ff8800',
    churnType: 'Voluntary', lastActive: '3 days ago',
    factors: [
      { icon: Activity, label: 'Low engagement',        detail: 'Only 3 logins in the past 30 days (avg: 18)',          severity: 'warning'  },
      { icon: Zap,      label: 'No power features used',detail: 'Has not used any premium features since onboarding',    severity: 'warning'  },
      { icon: Shield,   label: 'Competitor signal',     detail: 'Visited pricing comparison pages 6 times this month',  severity: 'critical' },
    ],
    recommendation: 'Trigger educational email sequence + personalised demo of advanced features. Consider plan downgrade offer to retain.',
  },
  'USR-003': {
    id: 'USR-003', name: 'Zarina Mukhanova', plan: 'Enterprise',
    riskScore: 12, riskLevel: 'HEALTHY', riskColor: '#ccff00',
    churnType: 'None', lastActive: '30 minutes ago',
    factors: [
      { icon: CheckCircle, label: 'High engagement',  detail: 'Daily active user — 94th percentile engagement score', severity: 'healthy' },
      { icon: Activity,    label: 'Expanding usage',  detail: 'Added 4 new seats this quarter — growth signal',        severity: 'healthy' },
      { icon: Shield,      label: 'Long tenure',      detail: '3.2 year customer — NPS score 9/10 in last survey',     severity: 'healthy' },
    ],
    recommendation: 'Excellent retention profile. Candidate for upsell to Enterprise Plus and referral programme enrollment.',
  },
}

const sevCfg = {
  critical: { color: '#ff0055', bg: 'rgba(255,0,85,0.08)',   border: 'rgba(255,0,85,0.22)'   },
  warning:  { color: '#ff8800', bg: 'rgba(255,136,0,0.08)', border: 'rgba(255,136,0,0.22)'  },
  healthy:  { color: '#ccff00', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.22)'  },
}

export default function DeepScan() {
  const { t } = useI18n()
  const [query, setQuery]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const handleScan = async () => {
    if (!query.trim()) return
    setLoading(true); setError(null); setResult(null)
    await new Promise(r => setTimeout(r, 800))
    const found = mockUsers[query.trim().toUpperCase()]
    if (found) setResult(found)
    else setError(t.deepScan.notFound + ' "' + query + '". ' + t.deepScan.tryIds)
    setLoading(false)
  }

  return (
    <div className="space-y-5 md:space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">{t.deepScan.title}</h2>
        <p className="text-white/35 mt-1 text-xs md:text-sm">
          {t.deepScan.sub}
        </p>
      </div>

      {/* Search panel */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 md:p-6"
      >
        <label
          className="block text-[0.62rem] font-bold tracking-[0.2em] uppercase mb-3"
          style={{ color: '#ccff00' }}
        >
          {t.deepScan.label}
        </label>

        {/* Input + button — stacked on mobile, inline on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder={t.deepScan.placeholder}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/20 text-sm font-mono outline-none transition-all duration-200"
              style={{
                background: '#050505',
                border: '1px solid rgba(204,255,0,0.45)',
                boxShadow: 'inset 0 0 20px rgba(204,255,0,0.025)',
              }}
              onFocus={e => {
                e.target.style.boxShadow = '0 0 0 2px rgba(204,255,0,0.35), inset 0 0 20px rgba(204,255,0,0.04), 0 0 24px rgba(204,255,0,0.1)'
              }}
              onBlur={e => {
                e.target.style.boxShadow = 'inset 0 0 20px rgba(204,255,0,0.025)'
              }}
            />
          </div>

          <motion.button
            onClick={handleScan}
            disabled={loading || !query.trim()}
            whileTap={{ scale: 0.96 }}
            className="btn-lime flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm w-full sm:w-auto"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                />
                {t.deepScan.scanning}
              </>
            ) : (
              <>
                <Zap size={15} strokeWidth={3} />
                {t.deepScan.runAnalysis}
              </>
            )}
          </motion.button>
        </div>

        <p className="text-[0.62rem] text-white/25 mt-3">
          {t.deepScan.tryLabel}{' '}
          {['USR-001', 'USR-002', 'USR-003'].map((id, i) => (
            <span key={id}>
              <button
                onClick={() => setQuery(id)}
                className="font-mono text-white/45 hover:text-white transition-colors"
              >
                {id}
              </button>
              {i < 2 && <span className="mx-1">·</span>}
            </span>
          ))}
        </p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-xl p-4 flex items-start gap-3"
            style={{ border: '1px solid rgba(255,0,85,0.3)' }}
          >
            <XCircle size={17} className="flex-shrink-0 mt-0.5" style={{ color: '#ff0055' }} />
            <span className="text-sm" style={{ color: '#ff0055' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${result.riskColor}28`,
              boxShadow: `0 0 40px ${result.riskColor}12`,
            }}
          >
            {/* ── Card header ── */}
            <div className="p-5 md:p-6" style={{ background: 'rgba(8,8,8,0.95)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h3 className="text-xl md:text-2xl font-black text-white">{result.name}</h3>
                    <span className="text-[0.6rem] text-white/30 font-mono">{result.id}</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className="text-[0.62rem] px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa' }}
                    >
                      {result.plan}
                    </span>
                    <span className="text-[0.62rem] text-white/30">
                      {t.deepScan.lastActive}: {result.lastActive}
                    </span>
                  </div>
                </div>

                {/* Risk score */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="text-4xl md:text-5xl font-black leading-none"
                    style={{
                      color: result.riskColor,
                      textShadow: `0 0 16px ${result.riskColor}`,
                    }}
                  >
                    {result.riskScore}
                  </div>
                  <div
                    className="text-[0.6rem] font-bold tracking-widest mt-0.5"
                    style={{ color: result.riskColor }}
                  >
                    {result.riskLevel}
                  </div>
                  <div className="text-[0.6rem] text-white/30 mt-0.5">{result.churnType} {t.deepScan.risk}</div>
                </div>
              </div>

              {/* Risk bar */}
              <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.riskScore}%` }}
                  transition={{ duration: 0.85, ease: 'easeOut', delay: 0.15 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${result.riskColor}66, ${result.riskColor})`,
                    boxShadow: `0 0 8px ${result.riskColor}`,
                  }}
                />
              </div>
            </div>

            {/* ── Factors ── */}
            <div
              className="px-5 md:px-6 pt-4 pb-3 space-y-2.5"
              style={{ background: 'rgba(6,6,6,0.97)' }}
            >
              <p className="text-[0.6rem] font-bold tracking-[0.16em] uppercase text-white/25 mb-3">
                {t.deepScan.riskFactors}
              </p>
              {result.factors.map((factor, i) => {
                const Icon = factor.icon
                const cfg = sevCfg[factor.severity]
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i + 0.25 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}14` }}
                    >
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                        {factor.label}
                      </p>
                      <p className="text-[0.65rem] text-white/35 mt-0.5 leading-snug">
                        {factor.detail}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* ── Recommendation ── */}
            <div className="px-5 md:px-6 pb-5 md:pb-6" style={{ background: 'rgba(6,6,6,0.97)' }}>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(204,255,0,0.05)',
                  border: '1px solid rgba(204,255,0,0.18)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={13} style={{ color: '#ccff00' }} />
                  <span
                    className="text-[0.6rem] font-bold tracking-widest uppercase"
                    style={{ color: '#ccff00' }}
                  >
                    {t.deepScan.aiRecommendation}
                  </span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
