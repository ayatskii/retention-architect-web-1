import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, CheckCircle, XCircle, Zap, Clock, CreditCard, Activity, Shield } from 'lucide-react'

const mockUsers = {
  'USR-001': {
    id: 'USR-001',
    name: 'Aisha Bekova',
    plan: 'Professional',
    riskScore: 87,
    riskLevel: 'CRITICAL',
    riskColor: '#ff0055',
    churnType: 'Involuntary',
    lastActive: '2 hours ago',
    factors: [
      { icon: CreditCard, label: 'Payment failure', detail: 'Active but payment failed 3 times in last 14 days', severity: 'critical' },
      { icon: Clock, label: 'Session length drop', detail: 'Avg session time dropped 62% over past 7 days', severity: 'warning' },
      { icon: Activity, label: 'Feature usage decline', detail: 'Core feature engagement down 45% month-over-month', severity: 'warning' },
      { icon: AlertTriangle, label: 'Support ticket open', detail: 'Unresolved billing dispute ticket #TK-8821', severity: 'critical' },
    ],
    recommendation: 'Immediate automated payment retry + CSM outreach within 24h. Offer 2-month discount to neutralize billing friction.',
  },
  'USR-002': {
    id: 'USR-002',
    name: 'Damir Seitkali',
    plan: 'Starter',
    riskScore: 41,
    riskLevel: 'MODERATE',
    riskColor: '#ff8800',
    churnType: 'Voluntary',
    lastActive: '3 days ago',
    factors: [
      { icon: Activity, label: 'Low engagement', detail: 'Only 3 logins in the past 30 days (avg: 18)', severity: 'warning' },
      { icon: Zap, label: 'No power features used', detail: 'Has not used any premium features since onboarding', severity: 'warning' },
      { icon: Shield, label: 'Competitor signal', detail: 'Visited pricing comparison pages 6 times this month', severity: 'critical' },
    ],
    recommendation: 'Trigger educational email sequence + personalized demo of advanced features. Consider plan downgrade offer to retain.',
  },
  'USR-003': {
    id: 'USR-003',
    name: 'Zarina Mukhanova',
    plan: 'Enterprise',
    riskScore: 12,
    riskLevel: 'HEALTHY',
    riskColor: '#ccff00',
    churnType: 'None',
    lastActive: '30 minutes ago',
    factors: [
      { icon: CheckCircle, label: 'High engagement', detail: 'Daily active user — 94th percentile engagement score', severity: 'healthy' },
      { icon: Activity, label: 'Expanding usage', detail: 'Added 4 new seats this quarter — growth signal', severity: 'healthy' },
      { icon: Shield, label: 'Long tenure', detail: '3.2 year customer — NPS score 9/10 in last survey', severity: 'healthy' },
    ],
    recommendation: 'Excellent retention profile. Candidate for upsell to Enterprise Plus and referral program enrollment.',
  },
}

const severityConfig = {
  critical: { color: '#ff0055', bg: 'rgba(255,0,85,0.1)', border: 'rgba(255,0,85,0.25)' },
  warning: { color: '#ff8800', bg: 'rgba(255,136,0,0.1)', border: 'rgba(255,136,0,0.25)' },
  healthy: { color: '#ccff00', bg: 'rgba(204,255,0,0.1)', border: 'rgba(204,255,0,0.25)' },
}

export default function DeepScan() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleScan = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    // Simulate async engine call
    await new Promise((r) => setTimeout(r, 900))

    const found = mockUsers[query.trim().toUpperCase()]
    if (found) {
      setResult(found)
    } else {
      setError(`No user found for ID "${query}". Try USR-001, USR-002, or USR-003.`)
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleScan()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white">Deep Scan</h2>
        <p className="text-gray-500 mt-1 text-sm">Run instant AI risk analysis on any user ID</p>
      </div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(10,10,10,0.9)',
          border: '1px solid #1a1a1a',
        }}
      >
        <label className="text-xs font-bold tracking-[0.2em] uppercase mb-3 block" style={{ color: '#ccff00' }}>
          User ID / Subscriber Identifier
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. USR-001"
              className="w-full pl-11 pr-4 py-4 rounded-xl text-white placeholder-gray-600 text-base font-mono outline-none transition-all duration-200"
              style={{
                background: '#050505',
                border: '1px solid #ccff00',
                boxShadow: 'inset 0 0 20px rgba(204,255,0,0.03)',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(204,255,0,0.4), inset 0 0 20px rgba(204,255,0,0.05), 0 0 30px rgba(204,255,0,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'inset 0 0 20px rgba(204,255,0,0.03)'
              }}
            />
          </div>
          <motion.button
            onClick={handleScan}
            disabled={loading || !query.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: '#ccff00',
              color: '#000000',
              boxShadow: loading ? 'none' : '0 0 20px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.2)',
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                />
                Scanning...
              </>
            ) : (
              <>
                <Zap size={16} strokeWidth={3} />
                Run Analysis
              </>
            )}
          </motion.button>
        </div>

        <p className="text-xs text-gray-600 mt-3">
          Try: <button onClick={() => setQuery('USR-001')} className="text-gray-400 hover:text-white transition-colors font-mono">USR-001</button>
          {', '}
          <button onClick={() => setQuery('USR-002')} className="text-gray-400 hover:text-white transition-colors font-mono">USR-002</button>
          {', '}
          <button onClick={() => setQuery('USR-003')} className="text-gray-400 hover:text-white transition-colors font-mono">USR-003</button>
        </p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid rgba(255,0,85,0.3)' }}
          >
            <XCircle size={18} style={{ color: '#ff0055' }} />
            <span className="text-sm" style={{ color: '#ff0055' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${result.riskColor}33`,
              boxShadow: `0 0 40px ${result.riskColor}15, 0 0 80px ${result.riskColor}08`,
            }}
          >
            {/* Card Header */}
            <div className="p-6"
              style={{ background: `linear-gradient(135deg, rgba(10,10,10,0.95), rgba(10,10,10,0.9))` }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-white">{result.name}</h3>
                    <span className="text-xs font-mono text-gray-500">{result.id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>
                      {result.plan}
                    </span>
                    <span className="text-xs text-gray-500">Last active: {result.lastActive}</span>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="text-right">
                  <div className="text-4xl font-black" style={{
                    color: result.riskColor,
                    textShadow: `0 0 20px ${result.riskColor}`,
                  }}>
                    {result.riskScore}
                  </div>
                  <div className="text-xs font-bold tracking-widest" style={{ color: result.riskColor }}>
                    {result.riskLevel}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{result.churnType} churn risk</div>
                </div>
              </div>

              {/* Risk bar */}
              <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.riskScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${result.riskColor}88, ${result.riskColor})`,
                    boxShadow: `0 0 10px ${result.riskColor}`,
                  }}
                />
              </div>
            </div>

            {/* Explainability Factors */}
            <div className="px-6 pb-4 pt-4 space-y-3"
              style={{ background: 'rgba(8,8,8,0.95)' }}>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500 mb-4">
                Risk Explainability Factors
              </p>
              {result.factors.map((factor, i) => {
                const Icon = factor.icon
                const cfg = severityConfig[factor.severity]
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i + 0.3 }}
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cfg.color}18` }}>
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                        {factor.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{factor.detail}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Recommendation */}
            <div className="px-6 pb-6"
              style={{ background: 'rgba(8,8,8,0.95)' }}>
              <div className="rounded-xl p-4"
                style={{
                  background: 'rgba(204,255,0,0.06)',
                  border: '1px solid rgba(204,255,0,0.2)',
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} style={{ color: '#ccff00' }} />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ccff00' }}>
                    AI Recommendation
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
