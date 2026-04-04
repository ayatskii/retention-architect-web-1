import { motion } from 'framer-motion'
import HeroStats from './HeroStats'
import ActivityChart from './ActivityChart'
import TechFailureChart from './TechFailureChart'
import { ArrowRight, Zap, TrendingUp } from 'lucide-react'

const recentAlerts = [
  { id: 'USR-001', name: 'Aisha Bekova', event: 'Payment retry failed (3rd attempt)', severity: 'critical', time: '2m ago' },
  { id: 'USR-447', name: 'Temirkhan Abdi', event: 'Session frequency dropped 70%', severity: 'warning', time: '14m ago' },
  { id: 'USR-883', name: 'Lila Ospanova', event: 'Visited cancellation page twice', severity: 'warning', time: '31m ago' },
  { id: 'USR-219', name: 'Nurzhan Bekmukhanov', event: 'Downgrade intent signal detected', severity: 'moderate', time: '1h ago' },
]

const severityStyle = {
  critical: { color: '#ff0055', bg: 'rgba(255,0,85,0.1)', label: 'CRITICAL' },
  warning: { color: '#ff8800', bg: 'rgba(255,136,0,0.1)', label: 'WARNING' },
  moderate: { color: '#ffcc00', bg: 'rgba(255,204,0,0.1)', label: 'MODERATE' },
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-white leading-tight"
          >
            Diagnostic{' '}
            <span style={{ color: '#ccff00', textShadow: '0 0 30px rgba(204,255,0,0.5)' }}>
              Dashboard
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mt-1 text-sm"
          >
            Real-time churn intelligence & retention signals
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{
            background: 'rgba(204,255,0,0.1)',
            border: '1px solid rgba(204,255,0,0.3)',
            color: '#ccff00',
          }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ccff00', boxShadow: '0 0 6px #ccff00' }} />
          LIVE · Updated 3s ago
        </motion.div>
      </div>

      {/* Hero Stats */}
      <HeroStats />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ActivityChart />
        </div>
        <div className="lg:col-span-2">
          <TechFailureChart />
        </div>
      </div>

      {/* Recent Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(10,10,10,0.9)',
          border: '1px solid #1a1a1a',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Live Risk Alerts</h3>
            <p className="text-xs text-gray-500 mt-0.5">Triggered by behavioral ML signals</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#ccff00' }}>
            View all <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {recentAlerts.map((alert, i) => {
            const sev = severityStyle[alert.severity]
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: sev.bg, border: `1px solid ${sev.color}22` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: sev.color, boxShadow: `0 0 6px ${sev.color}` }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{alert.name}</span>
                      <span className="text-xs text-gray-600 font-mono">{alert.id}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{alert.event}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ color: sev.color, background: `${sev.color}18` }}>
                    {sev.label}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(204,255,0,0.08), rgba(0,0,0,0))',
          border: '1px solid rgba(204,255,0,0.2)',
        }}
      >
        <div className="absolute right-0 top-0 w-64 h-full opacity-5"
          style={{ background: 'radial-gradient(circle at right, #ccff00, transparent 70%)' }} />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} style={{ color: '#ccff00' }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ccff00' }}>
                Retention Potential
              </span>
            </div>
            <p className="text-xl font-black text-white">
              Recover up to <span style={{ color: '#ccff00' }}>$2.4M ARR</span> with automated interventions
            </p>
            <p className="text-xs text-gray-500 mt-1">Based on historical conversion rates and risk model confidence scores</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap"
            style={{
              background: '#ccff00',
              color: '#000',
              boxShadow: '0 0 20px rgba(204,255,0,0.4)',
            }}>
            <Zap size={15} strokeWidth={3} />
            Launch Campaign
          </button>
        </div>
      </motion.div>
    </div>
  )
}
