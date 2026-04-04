import { motion } from 'framer-motion'
import { AlertTriangle, Bell, Zap, ChevronRight } from 'lucide-react'

const alerts = [
  { id: 'USR-001', name: 'Aisha Bekova', event: 'Payment retry failed (3rd attempt)', severity: 'CRITICAL', color: '#ff0055', time: '2m ago', action: 'Trigger CSM call' },
  { id: 'USR-447', name: 'Temirkhan Abdi', event: 'Session frequency dropped 70% in 7 days', severity: 'HIGH', color: '#ff4400', time: '14m ago', action: 'Send re-engage email' },
  { id: 'USR-883', name: 'Lila Ospanova', event: 'Visited cancellation page twice this week', severity: 'HIGH', color: '#ff4400', time: '31m ago', action: 'Deploy retention offer' },
  { id: 'USR-219', name: 'Nurzhan Bekmukhanov', event: 'Downgrade intent signal detected', severity: 'MODERATE', color: '#ff8800', time: '1h ago', action: 'Send value email' },
  { id: 'USR-562', name: 'Daniya Seitkali', event: 'Feature adoption stalled at onboarding step 2', severity: 'MODERATE', color: '#ff8800', time: '2h ago', action: 'Trigger onboarding nudge' },
  { id: 'USR-731', name: 'Arman Dosov', event: 'Trial expiring in 48h — no purchase intent', severity: 'LOW', color: '#ffcc00', time: '3h ago', action: 'Offer trial extension' },
]

export default function Alerts() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Risk Alerts</h2>
          <p className="text-gray-500 mt-1 text-sm">ML-triggered behavioral anomalies requiring action</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid rgba(255,0,85,0.3)', color: '#ff0055' }}>
          <Bell size={13} />
          {alerts.length} Active Alerts
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{
              background: 'rgba(10,10,10,0.9)',
              border: `1px solid ${alert.color}22`,
              boxShadow: `0 0 20px ${alert.color}08`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${alert.color}15` }}>
                <AlertTriangle size={18} style={{ color: alert.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-white">{alert.name}</span>
                  <span className="text-xs font-mono text-gray-600">{alert.id}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ color: alert.color, background: `${alert.color}18` }}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{alert.event}</p>
                <p className="text-xs text-gray-600 mt-0.5">{alert.time}</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-all"
              style={{
                background: '#ccff00',
                color: '#000',
                boxShadow: '0 0 12px rgba(204,255,0,0.3)',
              }}>
              <Zap size={12} strokeWidth={3} />
              {alert.action}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
