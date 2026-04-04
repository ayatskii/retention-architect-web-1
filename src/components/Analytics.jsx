import { motion } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const churnTrend = [
  { month: 'Jan', voluntary: 18, involuntary: 12, recovered: 8 },
  { month: 'Feb', voluntary: 22, involuntary: 14, recovered: 11 },
  { month: 'Mar', voluntary: 19, involuntary: 11, recovered: 13 },
  { month: 'Apr', voluntary: 25, involuntary: 16, recovered: 18 },
  { month: 'May', voluntary: 21, involuntary: 13, recovered: 20 },
  { month: 'Jun', voluntary: 17, involuntary: 10, recovered: 22 },
  { month: 'Jul', voluntary: 15, involuntary: 9, recovered: 25 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-4"
      style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid #333' }}>
      <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-gray-300">{p.name}:</span>
          <span className="text-xs font-bold" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white">Analytics</h2>
        <p className="text-gray-500 mt-1 text-sm">Longitudinal churn analysis and recovery trends</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid #1a1a1a' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Churn vs Recovery Rate (%)</h3>
            <p className="text-xs text-gray-500 mt-1">7-month rolling window</p>
          </div>
          <div className="flex gap-4">
            {[
              { color: '#ff0055', label: 'Voluntary' },
              { color: '#ccff00', label: 'Involuntary' },
              { color: '#00ccff', label: 'Recovered' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-0.5" style={{ background: l.color }} />
                <span className="text-xs text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={churnTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff0055" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ff0055" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ccff00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ccff00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ccff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00ccff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="voluntary" name="Voluntary" stroke="#ff0055" strokeWidth={2} fill="url(#gradVol)" />
            <Area type="monotone" dataKey="involuntary" name="Involuntary" stroke="#ccff00" strokeWidth={2} fill="url(#gradInv)" />
            <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#00ccff" strokeWidth={2} fill="url(#gradRec)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Recovery Rate', value: '38.2%', color: '#ccff00', delta: '+4.1%' },
          { label: 'Churn Prediction Accuracy', value: '91.7%', color: '#00ccff', delta: '+1.3%' },
          { label: 'Interventions Triggered', value: '4,821', color: '#ccff00', delta: 'this month' },
          { label: 'ARR Recovered', value: '$1.8M', color: '#ff8800', delta: 'YTD' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(10,10,10,0.9)', border: `1px solid ${kpi.color}22` }}
          >
            <p className="text-xs text-gray-500 mb-2">{kpi.label}</p>
            <p className="text-2xl font-black" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
            <p className="text-xs mt-1" style={{ color: kpi.color, opacity: 0.6 }}>{kpi.delta}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
