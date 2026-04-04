import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Search,
  BarChart3,
  AlertTriangle,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'search', label: 'Deep Scan', icon: Search },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-muted flex flex-col relative">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)'
        }}
      />

      {/* Logo */}
      <div className="p-6 border-b border-muted">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#ccff00', boxShadow: '0 0 16px rgba(204,255,0,0.6)' }}>
            <Zap size={16} color="#000" strokeWidth={3} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-white uppercase leading-none">
              Retention
            </p>
            <p className="text-xs font-bold tracking-[0.2em] uppercase leading-none" style={{ color: '#ccff00' }}>
              Architect
            </p>
          </div>
        </div>
        <div className="mt-3">
          <span className="text-xs px-2 py-0.5 rounded-full border font-mono"
            style={{ borderColor: '#ccff00', color: '#ccff00', fontSize: '0.55rem', letterSpacing: '0.1em' }}>
            HackNU 2026
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                isActive
                  ? 'text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-muted'
              )}
              style={isActive ? {
                background: '#ccff00',
                boxShadow: '0 0 20px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.15)',
              } : {}}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </motion.button>
          )
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-muted">
        <div className="rounded-xl p-3" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ccff00', boxShadow: '0 0 6px #ccff00' }} />
            <span className="text-xs font-semibold text-gray-300">SYSTEM ONLINE</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Engine</span>
              <span style={{ color: '#ccff00' }} className="font-mono">v2.4.1</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Models</span>
              <span style={{ color: '#ccff00' }} className="font-mono">7 active</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
