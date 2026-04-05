import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Search,
  BarChart3,
  AlertTriangle,
  Settings,
  Zap,
  ChevronRight,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useI18n } from '../context/I18nContext'

const navItems = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { id: 'search',    labelKey: 'deepScan',  icon: Search },
  { id: 'analytics', labelKey: 'analyticsNav',  icon: BarChart3 },
  { id: 'alerts',    labelKey: 'riskAlerts',icon: AlertTriangle },
  { id: 'settings',  labelKey: 'settings',   icon: Settings },
]

export default function Sidebar({ activeView, onNavigate, isCollapsed, onClose, isMobile }) {
  const { t } = useI18n()
  const ref = useRef(null)

  // Close on outside click (mobile overlay)
  useEffect(() => {
    if (!isMobile || isCollapsed) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isMobile, isCollapsed, onClose])

  const sidebarContent = (
    <div
      ref={ref}
      className={clsx(
        'glass-sidebar relative flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden',
        isCollapsed ? 'w-[68px]' : 'w-64',
      )}
      style={{
        boxShadow: isCollapsed
          ? 'none'
          : '4px 0 40px rgba(204,255,0,0.06)',
      }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)',
        }}
      />

      {/* ── Logo ─────────────────────────────────── */}
      <div className={clsx(
        'relative z-10 flex items-center border-b border-white/[0.06] transition-all duration-300',
        isCollapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5 gap-3',
      )}>
        {/* Icon mark */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: '#ccff00',
            boxShadow: '0 0 16px rgba(204,255,0,0.55), 0 0 32px rgba(204,255,0,0.2)',
          }}
        >
          <Zap size={17} color="#000" strokeWidth={3} />
        </div>

        {/* Wordmark */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p
                className="text-xl font-black tracking-tight leading-none neon-lime"
                style={{ color: '#ccff00', letterSpacing: '-0.02em' }}
              >
                {t.sidebar.wins}
              </p>
              <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-white/40 uppercase mt-0.5">
                {t.sidebar.retentionEngine}
              </p>
              <span
                className="inline-block mt-1.5 text-[0.52rem] px-2 py-0.5 rounded-full border font-mono font-bold tracking-widest"
                style={{ borderColor: 'rgba(204,255,0,0.35)', color: 'rgba(204,255,0,0.7)' }}
              >
                {t.sidebar.hacknu}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile close */}
        {isMobile && !isCollapsed && (
          <button
            onClick={onClose}
            className="ml-auto flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────── */}
      <nav className="relative z-10 flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <div key={item.id} className="tooltip-wrap">
              <motion.button
                onClick={() => { onNavigate(item.id); if (isMobile) onClose() }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  'w-full flex items-center rounded-xl transition-all duration-200 outline-none',
                  isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3',
                  isActive ? 'nav-item-active font-bold' : 'nav-item-idle',
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className="flex-shrink-0"
                />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium flex-1 text-left whitespace-nowrap"
                    >
                      {t.sidebar[item.labelKey]}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!isCollapsed && isActive && (
                  <ChevronRight size={13} className="flex-shrink-0" />
                )}
              </motion.button>

              {/* Icon-only tooltip */}
              {isCollapsed && (
                <span className="tooltip">{t.sidebar[item.labelKey]}</span>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Status Footer ────────────────────────── */}
      <div className={clsx(
        'relative z-10 border-t border-white/[0.06] transition-all duration-300',
        isCollapsed ? 'p-2' : 'p-3',
      )}>
        {isCollapsed ? (
          /* Collapsed: just a pulsing dot */
          <div className="flex justify-center py-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#ccff00', boxShadow: '0 0 8px #ccff00' }}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl p-3"
            style={{ background: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#ccff00', boxShadow: '0 0 6px #ccff00' }}
              />
              <span className="text-[0.62rem] font-bold tracking-[0.14em] text-white/70 uppercase">
                {t.sidebar.systemOnline}
              </span>
            </div>
            <div className="space-y-1">
              {[[t.sidebar.engine, 'v2.4.1'], [t.sidebar.models, '7 active'], [t.sidebar.uptime, '99.98%']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[0.65rem] text-white/30">{k}</span>
                  <span className="text-[0.65rem] font-mono font-semibold" style={{ color: '#ccff00' }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )

  // Mobile: render as fixed overlay
  if (isMobile) {
    return (
      <AnimatePresence>
        {!isCollapsed && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 z-50 h-full"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Desktop: inline
  return sidebarContent
}
