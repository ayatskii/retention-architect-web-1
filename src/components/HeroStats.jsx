import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Users } from 'lucide-react'

const stats = [
  {
    label: 'RECOVERABLE ASSETS',
    value: '22,500',
    color: '#ccff00',
    glow: 'rgba(204,255,0,0.8)',
    glowSoft: 'rgba(204,255,0,0.2)',
    icon: TrendingUp,
    trend: '+12.4%',
    trendUp: true,
    description: 'Users at risk — recoverable via targeted intervention',
  },
  {
    label: 'TOTAL ECOSYSTEM',
    value: '90,000',
    color: '#ffffff',
    glow: 'rgba(255,255,255,0.6)',
    glowSoft: 'rgba(255,255,255,0.1)',
    icon: Users,
    trend: '+8.1%',
    trendUp: true,
    description: 'Active subscribers across all product tiers',
  },
  {
    label: 'VOLUNTARY CHURN',
    value: '22,500',
    color: '#ff0055',
    glow: 'rgba(255,0,85,0.8)',
    glowSoft: 'rgba(255,0,85,0.2)',
    icon: TrendingDown,
    trend: '-3.2%',
    trendUp: false,
    description: 'Intentional cancellations requiring outreach programs',
  },
]

export default function HeroStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.9)',
              border: `1px solid ${stat.color}22`,
              boxShadow: `0 0 30px ${stat.glowSoft}, inset 0 0 30px ${stat.glowSoft}`,
            }}
          >
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10"
              style={{ background: stat.color }} />

            {/* Icon */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase"
                style={{ color: stat.color, opacity: 0.8 }}>
                {stat.label}
              </span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}33` }}>
                <Icon size={16} style={{ color: stat.color }} strokeWidth={2} />
              </div>
            </div>

            {/* Main Value */}
            <div
              className="font-black leading-none mb-3"
              style={{
                fontSize: '3.5rem',
                color: stat.color,
                textShadow: `0 0 20px ${stat.glow}, 0 0 40px ${stat.glowSoft}, 0 0 80px ${stat.glowSoft}`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stat.value}
            </div>

            {/* Trend */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: stat.trendUp ? 'rgba(204,255,0,0.15)' : 'rgba(255,0,85,0.15)',
                  color: stat.trendUp ? '#ccff00' : '#ff0055',
                }}>
                {stat.trend}
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed">{stat.description}</p>

            {/* Bottom glow bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
          </motion.div>
        )
      })}
    </div>
  )
}
