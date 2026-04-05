import { motion } from 'framer-motion'
import HeroStats from './HeroStats'
import ActivityChart from './ActivityChart'
import TechFailureChart from './TechFailureChart'
import { ArrowRight, Zap, TrendingUp } from 'lucide-react'
import { useI18n } from '../context/I18nContext'

const recentAlerts = [
  { id: 'USR-001', name: 'Aisha Bekova',        event: 'Payment retry failed (3rd attempt)',   severity: 'critical', time: '2m ago' },
  { id: 'USR-447', name: 'Temirkhan Abdi',      event: 'Session frequency dropped 70%',        severity: 'warning',  time: '14m ago' },
  { id: 'USR-883', name: 'Lila Ospanova',       event: 'Visited cancellation page twice',      severity: 'warning',  time: '31m ago' },
  { id: 'USR-219', name: 'Nurzhan Bekmukhanov', event: 'Downgrade intent signal detected',     severity: 'moderate', time: '1h ago' },
]

const sevStyle = {
  critical: { color: '#ff0055', bg: 'rgba(255,0,85,0.08)',   border: 'rgba(255,0,85,0.18)',   label: 'CRITICAL' },
  warning:  { color: '#ff8800', bg: 'rgba(255,136,0,0.08)', border: 'rgba(255,136,0,0.18)', label: 'WARNING'  },
  moderate: { color: '#ffcc00', bg: 'rgba(255,204,0,0.08)', border: 'rgba(255,204,0,0.18)', label: 'MODERATE' },
}

export default function Dashboard() {
  const { t } = useI18n()
  return (
    <div className="space-y-6 md:space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight"
          >
            {t.dashboard.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/35 mt-1 text-xs md:text-sm"
          >
            {t.dashboard.sub}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="hidden sm:flex flex-shrink-0 items-center gap-2 px-3 py-1.5 rounded-full text-[0.65rem] font-bold"
          style={{
            background: 'rgba(204,255,0,0.07)',
            border: '1px solid rgba(204,255,0,0.2)',
            color: '#ccff00',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#ccff00', boxShadow: '0 0 5px #ccff00' }}
          />
          {t.dashboard.liveAgo}
        </motion.div>
      </div>

      {/* ── Hero Stats ── */}
      <HeroStats />

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">
        <div className="lg:col-span-3">
          <ActivityChart />
        </div>
        <div className="lg:col-span-2">
          <TechFailureChart />
        </div>
      </div>

      {/* ── Alert Feed ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white">{t.dashboard.liveAlerts}</h3>
            <p className="text-[0.65rem] text-white/30 mt-0.5">{t.dashboard.alertsSub}</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
            style={{ color: '#ccff00' }}>
            {t.dashboard.viewAll} <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentAlerts.map((alert, i) => {
            const sev = sevStyle[alert.severity]
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.07 }}
                className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-xl"
                style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: sev.color, boxShadow: `0 0 5px ${sev.color}` }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs md:text-sm font-semibold text-white truncate">{alert.name}</span>
                      <span className="text-[0.6rem] text-white/30 font-mono hidden sm:inline">{alert.id}</span>
                    </div>
                    <p className="text-[0.62rem] md:text-xs text-white/40 mt-0.5 truncate">{alert.event}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span
                    className="text-[0.6rem] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                    style={{ color: sev.color, background: `${sev.color}18` }}
                  >
                    {sev.label}
                  </span>
                  <p className="text-[0.6rem] text-white/25 mt-1">{alert.time}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── ARR Recovery CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(204,255,0,0.07) 0%, rgba(0,0,0,0) 60%)',
          border: '1px solid rgba(204,255,0,0.18)',
        }}
      >
        <div
          className="absolute right-0 top-0 w-1/2 h-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at right, #ccff00, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp size={14} style={{ color: '#ccff00' }} />
              <span
                className="text-[0.6rem] font-bold tracking-[0.18em] uppercase"
                style={{ color: '#ccff00' }}
              >
                {t.dashboard.retentionPotential}
              </span>
            </div>
            <p className="text-lg md:text-xl font-black text-white leading-snug">
              {t.dashboard.recoverUpTo}{' '}
              <span className="neon-lime" style={{ color: '#ccff00' }}>$2.4M ARR</span>
              {' '}{t.dashboard.withAutoInterventions}
            </p>
            <p className="text-[0.62rem] text-white/30 mt-1">
              {t.dashboard.basedOnRates}
            </p>
          </div>
          <button
            className="btn-lime flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm whitespace-nowrap self-start sm:self-auto"
          >
            <Zap size={14} strokeWidth={3} />
            {t.dashboard.launchCampaign}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
