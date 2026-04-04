import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Payment Failed', value: 8200, color: '#ccff00' },
  { name: 'Session Timeout', value: 4100, color: '#00ccff' },
  { name: 'API Error', value: 3300, color: '#ff8800' },
  { name: 'Auth Failure', value: 2400, color: '#ff0055' },
  { name: 'Network Drop', value: 1500, color: '#8800ff' },
]

const total = data.reduce((sum, d) => sum + d.value, 0)

const CustomTooltip = ({ active, payload }) => {
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
          {((entry.value / total) * 100).toFixed(1)}% of technical failures
        </p>
      </div>
    )
  }
  return null
}

export default function TechFailureChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(10,10,10,0.9)',
        border: '1px solid #1a1a1a',
        boxShadow: '0 0 40px rgba(255,0,85,0.05)',
      }}
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Technical Failure Breakdown</h3>
        <p className="text-xs text-gray-500 mt-1">Involuntary churn causes — automated recovery eligible</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <defs>
                {data.map((entry) => (
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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
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
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div style={{ height: '105px' }} />
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((entry) => (
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
