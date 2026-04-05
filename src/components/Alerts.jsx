import { motion } from 'framer-motion'
import { AlertTriangle, Bell, Zap } from 'lucide-react'
import { useI18n } from '../context/I18nContext'

export default function Alerts() {
  const { t } = useI18n()

  const alerts = [
    { id: 'USR-001', name: 'Aisha Bekova',         event: t.alerts.event1, severity: 'CRITICAL', color: '#ff0055', time: '2m ago',  action: t.alerts.action1 },
    { id: 'USR-447', name: 'Temirkhan Abdi',       event: t.alerts.event2, severity: 'HIGH',     color: '#ff4400', time: '14m ago', action: t.alerts.action2 },
    { id: 'USR-883', name: 'Lila Ospanova',        event: t.alerts.event3, severity: 'HIGH',     color: '#ff4400', time: '31m ago', action: t.alerts.action3 },
    { id: 'USR-219', name: 'Nurzhan Bekmukhanov',  event: t.alerts.event4, severity: 'MODERATE', color: '#ff8800', time: '1h ago',  action: t.alerts.action4 },
    { id: 'USR-562', name: 'Daniya Seitkali',      event: t.alerts.event5, severity: 'MODERATE', color: '#ff8800', time: '2h ago',  action: t.alerts.action5 },
    { id: 'USR-731', name: 'Arman Dosov',          event: t.alerts.event6, severity: 'LOW',      color: '#ffcc00', time: '3h ago',  action: t.alerts.action6 },
  ]

  return (
    <div className="space-y-5 md:space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{t.alerts.title}</h2>
          <p className="text-white/35 mt-1 text-xs md:text-sm">
            {t.alerts.sub}
          </p>
        </div>
        <div
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
          style={{
            background: 'rgba(255,0,85,0.08)',
            border: '1px solid rgba(255,0,85,0.25)',
            color: '#ff0055',
          }}
        >
          <Bell size={13} />
          {alerts.length} {t.alerts.active}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card rounded-2xl p-4 md:p-5"
            style={{ border: `1px solid ${alert.color}18` }}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${alert.color}12` }}
              >
                <AlertTriangle size={17} style={{ color: alert.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                  <span className="text-sm font-bold text-white">{alert.name}</span>
                  <span className="hidden sm:inline text-[0.6rem] text-white/25 font-mono">{alert.id}</span>
                  <span
                    className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ color: alert.color, background: `${alert.color}14` }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[0.65rem] md:text-xs text-white/40 truncate">{alert.event}</p>
                <p className="text-[0.58rem] text-white/20 mt-0.5">{alert.time}</p>
              </div>

              {/* Action button */}
              <button
                className="btn-lime hidden sm:flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-xl whitespace-nowrap flex-shrink-0"
              >
                <Zap size={11} strokeWidth={3} />
                {alert.action}
              </button>
            </div>

            {/* Mobile action button — full width */}
            <button
              className="btn-lime sm:hidden mt-3 w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl"
            >
              <Zap size={12} strokeWidth={3} />
              {alert.action}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
