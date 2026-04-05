import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../context/I18nContext'

const CustomTooltip = ({ active, payload }) => {
  const { t } = useI18n()
  if (active && payload && payload.length) {
    const entry = payload[0].payload
    return (
      <div className="rounded-xl p-4"
        style={{
          background: 'rgba(10,10,10,0.95)',
          border: `1px solid ${entry.color}44`,
          boxShadow: `0 0 20px ${entry.color}33`,
        }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: entry.color }}>
          {entry.name}
        </p>
        <p className="text-2xl font-black text-white">
          {entry.value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {((entry.value / entry.total) * 100).toFixed(1)}{t.techFailure.ofTechFailures}
        </p>
      </div>
    )
  }
  return null
}

export default function TechFailureChart() {
  const { t } = useI18n()

  const data = [
    { name: t.techFailure.paymentFailed, value: 8200, color: '#ccff00' },
    { name: t.techFailure.sessionTimeout, value: 4100, color: '#00ccff' },
    { name: t.techFailure.apiError, value: 3300, color: '#ff8800' },
    { name: t.techFailure.authFailure, value: 2400, color: '#ff0055' },
    { name: t.techFailure.networkDrop, value: 1500, color: '#8800ff' },
  ]

  const total = data.reduce((sum, d) => sum + d.value, 0)

  // Attach total to each entry so the tooltip can compute percentages
  const dataWithTotal = data.map(d => ({ ...d, total }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 md:p-6"
      style={{ boxShadow: '0 0 40px rgba(255,0,85,0.04)' }}
    >
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-white">{t.techFailure.title}</h3>
        <p className="text-[0.65rem] text-white/30 mt-0.5">{t.techFailure.sub}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <defs>
                {dataWithTotal.map((entry) => (
                  <filter key={entry.name} id={`glow-pie-${entry.name.replace(/\s/g, '')}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{ filter: `drop-shadow(0 0 8px ${entry.color}88)` }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="relative" style={{ marginTop: '-125px', textAlign: 'center', pointerEvents: 'none' }}>
            <p className="text-2xl font-black text-white">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{t.techFailure.total}</p>
          </div>
          <div style={{ height: '105px' }} />
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {dataWithTotal.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                <span className="text-sm text-gray-300">{entry.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color: entry.color }}>
                  {entry.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({((entry.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
