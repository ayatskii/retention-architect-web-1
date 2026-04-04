import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, ChevronDown, Zap, User } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { clsx } from 'clsx'

const LANGS = ['EN', 'RU', 'KZ']
const PAGES = ['overview', 'strategyLab']

export default function Navbar({ activePage, onNavigate }) {
  const { lang, changeLang, t } = useI18n()
  const { isDark, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const pageLabels = {
    overview: t.nav.overview,
    strategyLab: t.nav.strategyLab,
  }

  return (
    <>
      {/* Chromatic top stripe */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px"
        style={{ background: 'linear-gradient(90deg,#ccff00,#00e5ff 40%,#ff0055)' }} />

      {/* Main navbar */}
      <header className={clsx(
        'fixed top-px left-0 right-0 z-40 border-b transition-colors duration-300',
        isDark
          ? 'bg-black/90 border-white/[0.06]'
          : 'bg-white/90 border-black/[0.06]',
        'backdrop-blur-xl',
      )}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 flex items-center h-16 gap-6">

          {/* ── Brand ── */}
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#ccff00', boxShadow: '0 0 14px rgba(204,255,0,0.55)' }}>
              <Zap size={15} color="#000" strokeWidth={3} />
            </div>
            <span
              className="text-xl font-black tracking-tight"
              style={{
                color: '#ccff00',
                textShadow: '0 0 16px rgba(204,255,0,0.6)',
                letterSpacing: '-0.01em',
              }}
            >
              {t.nav.brand}
            </span>
          </button>

          {/* ── Desktop Nav links ── */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {PAGES.map((page) => {
              const isActive = activePage === page
              return (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  className={clsx(
                    'relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                    isActive
                      ? isDark ? 'text-black' : 'text-black'
                      : isDark
                        ? 'text-white/45 hover:text-white hover:bg-white/06'
                        : 'text-black/45 hover:text-black hover:bg-black/06',
                  )}
                  style={isActive ? {
                    background: '#ccff00',
                    boxShadow: '0 0 16px rgba(204,255,0,0.35)',
                  } : {}}
                >
                  {pageLabels[page]}
                </button>
              )
            })}
          </nav>

          <div className="flex-1 md:flex-none" />

          {/* ── Right Controls ── */}
          <div className="hidden md:flex items-center gap-2">

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(v => !v)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200',
                  isDark
                    ? 'bg-white/06 text-white/70 hover:bg-white/10 hover:text-white border border-white/08'
                    : 'bg-black/06 text-black/60 hover:bg-black/10 hover:text-black border border-black/08',
                )}
              >
                {lang}
                <ChevronDown size={12} className={clsx('transition-transform duration-200', langOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.14 }}
                    className={clsx(
                      'absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden border shadow-2xl z-50',
                      isDark
                        ? 'bg-[#0a0a0a] border-white/10'
                        : 'bg-white border-black/10',
                    )}
                  >
                    {LANGS.map((l) => (
                      <button
                        key={l}
                        onClick={() => { changeLang(l); setLangOpen(false) }}
                        className={clsx(
                          'w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-4',
                          l === lang
                            ? 'text-black'
                            : isDark ? 'text-white/50 hover:text-white hover:bg-white/05' : 'text-black/50 hover:text-black hover:bg-black/05',
                        )}
                        style={l === lang ? { background: '#ccff00' } : {}}
                      >
                        {l}
                        {l === lang && <span className="text-[0.55rem] opacity-70">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                isDark
                  ? 'bg-white/06 text-white/50 hover:bg-white/10 hover:text-white border border-white/08'
                  : 'bg-black/06 text-black/50 hover:bg-black/10 hover:text-black border border-black/08',
              )}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black cursor-pointer border"
              style={{ background: '#ccff00', color: '#000', borderColor: 'transparent', boxShadow: '0 0 10px rgba(204,255,0,0.3)' }}
            >
              PM
            </div>
          </div>

          {/* ── Mobile menu toggle ── */}
          <button
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen
              ? <X size={18} className={isDark ? 'text-white' : 'text-black'} />
              : <Menu size={18} className={isDark ? 'text-white' : 'text-black'} />
            }
          </button>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className={clsx(
                'overflow-hidden border-t md:hidden',
                isDark ? 'border-white/06' : 'border-black/06',
              )}
            >
              <div className="px-4 py-4 space-y-1">
                {PAGES.map((page) => {
                  const isActive = activePage === page
                  return (
                    <button
                      key={page}
                      onClick={() => { onNavigate(page); setMobileOpen(false) }}
                      className={clsx(
                        'w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        isActive ? 'text-black' : isDark ? 'text-white/50' : 'text-black/50',
                      )}
                      style={isActive ? { background: '#ccff00' } : {}}
                    >
                      {pageLabels[page]}
                    </button>
                  )
                })}

                {/* Mobile language + theme row */}
                <div className="flex items-center gap-2 pt-3 border-t"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                  {LANGS.map((l) => (
                    <button
                      key={l}
                      onClick={() => changeLang(l)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                        l === lang ? 'text-black' : isDark ? 'text-white/40' : 'text-black/40',
                      )}
                      style={l === lang ? { background: '#ccff00' } : {}}
                    >
                      {l}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={toggleTheme}
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      isDark ? 'bg-white/06 text-white/50' : 'bg-black/06 text-black/50',
                    )}
                  >
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black"
                    style={{ background: '#ccff00', color: '#000' }}>
                    PM
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer so content doesn't hide under sticky navbar */}
      <div className="h-[65px]" />
    </>
  )
}
