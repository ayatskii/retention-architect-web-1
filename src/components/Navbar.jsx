import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, ChevronDown, ChevronRight, ArrowLeft, Zap, Eye, Users, Activity, BarChart2, Layers } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentFg, accentGlow, accentTextShadow } from '../lib/theme'
import { clsx } from 'clsx'

const LANGS = ['EN', 'RU', 'KZ']

const PAGE_CONFIG = [
  { key: 'overview',    icon: Eye      },
  { key: 'segments',    icon: Users    },
  { key: 'diagnostics', icon: Activity },
  { key: 'model',       icon: BarChart2 },
  { key: 'strategyLab', icon: Layers   },
]

export default function Navbar({ activePage, onNavigate }) {
  const { lang, changeLang, t } = useI18n()
  const { isDark, toggleTheme }  = useTheme()
  const accent = getAccent(isDark)
  const fg     = accentFg(isDark)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen,   setLangOpen]   = useState(false)

  const label = (key) => t.nav[key] || key

  const navBtn = (cfg) => {
    const active = activePage === cfg.key || (cfg.key === 'overview' && activePage === 'taskDetail')
    const Icon   = cfg.icon
    return (
      <button
        key={cfg.key}
        onClick={() => onNavigate(cfg.key)}
        className={clsx(
          'relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
          active
            ? ''
            : isDark
              ? 'text-white/45 hover:text-white hover:bg-white/[0.06]'
              : 'text-black/45 hover:text-black hover:bg-black/[0.06]',
        )}
        style={active ? { background: accent, color: fg, boxShadow: accentGlow(isDark) } : {}}
      >
        <Icon size={14} strokeWidth={active ? 2.5 : 2} />
        {label(cfg.key)}
      </button>
    )
  }

  return (
    <>
      {/* ── Chromatic top stripe ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px"
        style={{ background: 'linear-gradient(90deg,#ccff00,#00e5ff 40%,#ff0055)' }} />

      {/* ── Main header ── */}
      <header className={clsx(
        'fixed top-px left-0 right-0 z-40 border-b backdrop-blur-xl transition-colors duration-300',
        isDark ? 'bg-black/90 border-white/[0.06]' : 'bg-white/90 border-black/[0.06]',
      )}>
        <div className="relative max-w-screen-xl mx-auto px-4 md:px-6 flex items-center h-16">

          {/* ── Brand ── */}
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-2.5 flex-shrink-0 z-10"
          >
            <div className="wins-logo-pulse w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: accent }}>
              <Zap size={15} color={fg} strokeWidth={3} />
            </div>
            <span
              className="text-xl font-black tracking-tight hidden sm:block"
              style={{ color: accent, textShadow: accentTextShadow(isDark), letterSpacing: '-0.01em' }}
            >
              {t.nav.brand}
            </span>
          </button>

          {/* ── Nav links (centered, desktop) ── */}
          <nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {PAGE_CONFIG.map(cfg => navBtn(cfg))}
          </nav>

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* ── Right controls ── */}
          <div className="hidden md:flex items-center gap-2 z-10">

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(v => !v)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border',
                  isDark
                    ? 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white border-white/[0.08]'
                    : 'bg-black/[0.06] text-black/60 hover:bg-black/10 hover:text-black border-black/[0.08]',
                )}
              >
                {lang}
                <ChevronDown size={12} className={clsx('transition-transform duration-200', langOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.13 }}
                    className={clsx(
                      'absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden border shadow-2xl z-50 min-w-[80px]',
                      isDark ? 'bg-[#080808] border-white/[0.1]' : 'bg-white border-black/[0.1]',
                    )}
                  >
                    {LANGS.map(l => (
                      <button
                        key={l}
                        onClick={() => { changeLang(l); setLangOpen(false) }}
                        className={clsx(
                          'w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-3',
                          l === lang
                            ? 'text-black'
                            : isDark
                              ? 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                              : 'text-black/50 hover:text-black hover:bg-black/[0.05]',
                        )}
                        style={l === lang ? { background: accent, color: fg } : {}}
                      >
                        {l}
                        {l === lang && <span className="text-[0.55rem] opacity-60">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border',
                isDark
                  ? 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white border-white/[0.08]'
                  : 'bg-black/[0.06] text-black/50 hover:bg-black/10 hover:text-black border-black/[0.08]',
              )}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black cursor-pointer"
              style={{ background: accent, color: fg, boxShadow: accentGlow(isDark, 'sm') }}
            >
              PM
            </div>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden z-10 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen
              ? <X    size={18} className={isDark ? 'text-white' : 'text-black'} />
              : <Menu size={18} className={isDark ? 'text-white' : 'text-black'} />}
          </button>
        </div>

        {/* ── Mobile nav links (md only, below lg) ── */}
        <nav className="hidden md:flex lg:hidden items-center gap-0.5 px-4 pb-2 overflow-x-auto">
          {PAGE_CONFIG.map(cfg => navBtn(cfg))}
        </nav>

        {/* ── Breadcrumb for task detail ── */}
        {activePage === 'taskDetail' && (
          <div className={clsx(
            'border-t',
            isDark ? 'border-white/[0.04]' : 'border-black/[0.04]',
          )}>
            <div className="max-w-screen-xl mx-auto px-4 md:px-6 flex items-center gap-2 py-2 text-xs">
              <button
                onClick={() => onNavigate('overview')}
                className={clsx(
                  'flex items-center gap-1 font-semibold transition-colors',
                  isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black',
                )}
              >
                <ArrowLeft size={12} />
                {t.nav.overview}
              </button>
              <ChevronRight size={12} className={isDark ? 'text-white/20' : 'text-black/20'} />
              <span style={{ color: accent }} className="font-bold">
                {t.taskDetail?.breadcrumb || 'Task Details'}
              </span>
            </div>
          </div>
        )}

        {/* ── Mobile dropdown ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={clsx('overflow-hidden border-t md:hidden',
                isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}
            >
              <div className="px-4 py-4 space-y-1">
                {PAGE_CONFIG.map(cfg => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={cfg.key}
                      onClick={() => { onNavigate(cfg.key); setMobileOpen(false) }}
                      className={clsx(
                        'w-full text-left flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        (activePage === cfg.key || (cfg.key === 'overview' && activePage === 'taskDetail'))
                          ? 'text-black'
                          : isDark ? 'text-white/50' : 'text-black/50',
                      )}
                      style={(activePage === cfg.key || (cfg.key === 'overview' && activePage === 'taskDetail')) ? { background: accent, color: fg } : {}}
                    >
                      <Icon size={15} strokeWidth={2} />
                      {label(cfg.key)}
                    </button>
                  )
                })}

                {/* Language + theme row */}
                <div className="flex items-center gap-2 pt-3 border-t"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                  {LANGS.map(l => (
                    <button key={l} onClick={() => changeLang(l)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={l === lang ? { background: accent, color: fg }
                        : { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                      {l}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button onClick={toggleTheme}
                    className={clsx('w-9 h-9 rounded-xl flex items-center justify-center',
                      isDark ? 'bg-white/[0.06] text-white/50' : 'bg-black/[0.06] text-black/50')}>
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black"
                    style={{ background: accent, color: fg }}>PM</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Height offset — taller on md because of the second nav row, even taller with breadcrumb */}
      <div className={activePage === 'taskDetail' ? 'h-[97px] md:h-[137px] lg:h-[97px]' : 'h-[65px] md:h-[105px] lg:h-[65px]'} />
    </>
  )
}
