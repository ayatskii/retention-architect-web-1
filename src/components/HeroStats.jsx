import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Users } from 'lucide-react'
import { useI18n } from '../context/I18nContext'

export default function HeroStats() {
  const { t } = useI18n()

  const stats = [
    {
      label: t.heroStats.recoverableAssets,
      value: '22,500',
      color: '#ccff00',
      glow: 'rgba(204,255,0,0.85)',
      glowSoft: 'rgba(204,255,0,0.18)',
      borderColor: 'rgba(204,255,0,0.15)',
      icon: TrendingUp,
      trend: '+12.4%',
      trendUp: true,
      description: t.heroStats.recoverableDesc,
    },
    {
      label: t.heroStats.totalEcosystem,
      value: '90,000',
      color: '#ffffff',
      glow: 'rgba(255,255,255,0.6)',
      glowSoft: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.08)',
      icon: Users,
      trend: '+8.1%',
      trendUp: true,
      description: t.heroStats.ecosystemDesc,
    },
    {
      label: t.heroStats.voluntaryChurn,
      value: '22,500',
      color: '#ff0055',
      glow: 'rgba(255,0,85,0.85)',
      glowSoft: 'rgba(255,0,85,0.18)',
      borderColor: 'rgba(255,0,85,0.15)',
      icon: TrendingDown,
      trend: '-3.2%',
      trendUp: false,
      description: t.heroStats.voluntaryDesc,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.45, ease: 'easeOut' }}
            className="glass-card relative rounded-2xl p-5 md:p-6 overflow-hidden"
            style={{
              border: `1px solid ${stat.borderColor}`,
              boxShadow: `0 0 24px ${stat.glowSoft}, inset 0 0 24px ${stat.glowSoft}`,
            }}
          >
            {/* Corner radial glow */}
            <div
              className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-[0.07] blur-xl"
              style={{ background: stat.color }}
            />

            {/* Header row */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span
                className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.18em] uppercase"
                style={{ color: stat.color, opacity: 0.75 }}
              >
                {stat.label}
              </span>
              <div
                className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${stat.color}14`,
                  border: `1px solid ${stat.color}28`,
                }}
              >
                <Icon size={15} style={{ color: stat.color }} strokeWidth={2} />
              </div>
            </div>

            {/* Main number — responsive */}
            <div
              className="font-black leading-none mb-3 relative z-10 tabular-nums"
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 3.75rem)',
                color: stat.color,
                textShadow: `0 0 18px ${stat.glow}, 0 0 36px ${stat.glowSoft}, 0 0 72px ${stat.glowSoft}`,
              }}
            >
              {stat.value}
            </div>

            {/* Trend badge */}
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{
                  background: stat.trendUp ? 'rgba(204,255,0,0.12)' : 'rgba(255,0,85,0.12)',
                  color: stat.trendUp ? '#ccff00' : '#ff0055',
                }}
              >
                {stat.trend}
              </span>
              <span className="text-[0.65rem] text-white/30">{t.heroStats.vsLastPeriod}</span>
            </div>

            {/* Description */}
            <p className="text-[0.65rem] md:text-xs text-white/35 leading-relaxed relative z-10">
              {stat.description}
            </p>

            {/* Bottom gradient line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${stat.color}60, transparent)`,
              }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
