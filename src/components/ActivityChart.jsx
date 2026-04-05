import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useI18n } from '../context/I18nContext'

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useI18n()
  if (active && payload && payload.length) {
    const color = payload[0].payload.color
    return (
      <div className="rounded-xl p-4"
        style={{
          background: 'rgba(10,10,10,0.95)',
          border: `1px solid ${color}44`,
          boxShadow: `0 0 20px ${color}33`,
        }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-1"
          style={{ color }}>
          {label}
        </p>
        <p className="text-2xl font-black" style={{ color }}>
          {payload[0].value} <span className="text-sm font-normal text-gray-400">{t.activity.avgDays}</span>
        </p>
      </div>
    )
  }
  return null
}

const CustomBar = (props) => {
  const { x, y, width, height, color } = props
  return (
    <g>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.3} />
        </linearGradient>
        <filter id={`glow-${color.replace('#', '')}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#grad-${color.replace('#', '')})`}
        rx={6}
        filter={`url(#glow-${color.replace('#', '')})`}
      />
    </g>
  )
}

export default function ActivityChart() {
  const { t } = useI18n()

  const data = [
    { segment: t.activity.healthy, days: 5.9, color: '#ccff00' },
    { segment: t.activity.involuntary, days: 5.7, color: '#ccff00' },
    { segment: t.activity.voluntary, days: 4.3, color: '#ff0055' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 md:p-6"
      style={{ boxShadow: '0 0 40px rgba(204,255,0,0.04)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">{t.activity.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{t.activity.sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#ccff00', boxShadow: '0 0 6px #ccff00' }} />
            <span className="text-xs text-gray-400">{t.activity.recoverable}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#ff0055', boxShadow: '0 0 6px #ff0055' }} />
            <span className="text-xs text-gray-400">{t.activity.lost}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={72}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="segment"
            tick={{ fill: '#666', fontSize: 13, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 7]}
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="days" shape={<CustomBar />}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} color={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
