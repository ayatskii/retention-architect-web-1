import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useI18n } from '../context/I18nContext'

const churnTrend = [
  { month: 'Jan', voluntary: 18, involuntary: 12, recovered: 8 },
  { month: 'Feb', voluntary: 22, involuntary: 14, recovered: 11 },
  { month: 'Mar', voluntary: 19, involuntary: 11, recovered: 13 },
  { month: 'Apr', voluntary: 25, involuntary: 16, recovered: 18 },
  { month: 'May', voluntary: 21, involuntary: 13, recovered: 20 },
  { month: 'Jun', voluntary: 17, involuntary: 10, recovered: 22 },
  { month: 'Jul', voluntary: 15, involuntary:  9, recovered: 25 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-4"
      style={{ background: 'rgba(10,10,10,0.97)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[0.6rem] font-bold text-white/40 mb-2 uppercase tracking-widest">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-white/50">{p.name}:</span>
          <span className="text-xs font-bold" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { t } = useI18n()

  const lines = [
    { key: 'voluntary',   name: t.analytics.voluntary,   color: '#ff0055', grad: 'gradVol' },
    { key: 'involuntary', name: t.analytics.involuntary,  color: '#ccff00', grad: 'gradInv' },
    { key: 'recovered',   name: t.analytics.recovered,   color: '#00ccff', grad: 'gradRec' },
  ]

  const kpis = [
    { label: t.analytics.avgRecovery,      value: '38.2%', color: '#ccff00', delta: '+4.1%'              },
    { label: t.analytics.predAccuracy,      value: '91.7%', color: '#00ccff', delta: '+1.3%'              },
    { label: t.analytics.interventions,     value: '4,821', color: '#ccff00', delta: t.analytics.thisMonth },
    { label: t.analytics.arrRecovered,      value: '$1.8M', color: '#ff8800', delta: 'YTD'                },
  ]

  return (
    <div className="space-y-5 md:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">{t.analytics.title}</h2>
        <p className="text-white/35 mt-1 text-xs md:text-sm">
          {t.analytics.sub}
        </p>
      </div>

      {/* Area chart */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 md:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white">{t.analytics.chartTitle}</h3>
            <p className="text-[0.65rem] text-white/30 mt-0.5">{t.analytics.chartSub}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {lines.map(l => (
              <div key={l.key} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5" style={{ background: l.color }} />
                <span className="text-[0.62rem] text-white/40">{l.name}</span>
              </div>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={churnTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              {lines.map(l => (
                <linearGradient key={l.grad} id={l.grad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={l.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {lines.map(l => (
              <Area
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={2}
                fill={`url(#${l.grad})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* KPI grid — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.07 }}
            className="glass-card rounded-2xl p-4 md:p-5"
            style={{ border: `1px solid ${kpi.color}18` }}
          >
            <p className="text-[0.6rem] text-white/30 mb-2 leading-snug">{kpi.label}</p>
            <p
              className="text-xl md:text-2xl font-black"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </p>
            <p className="text-[0.6rem] mt-1" style={{ color: kpi.color, opacity: 0.55 }}>
              {kpi.delta}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
