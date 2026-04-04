import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import DeepScan from './components/DeepScan'
import Analytics from './components/Analytics'
import Alerts from './components/Alerts'

const views = {
  dashboard: Dashboard,
  search: DeepScan,
  analytics: Analytics,
  alerts: Alerts,
  settings: () => (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-600 text-lg">Settings panel — coming soon</p>
    </div>
  ),
}

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const View = views[activeView] || Dashboard

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <main className="flex-1 overflow-auto">
        {/* Top gradient bar */}
        <div className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, #ccff00, #00ccff, #ff0055)' }} />

        <div className="p-8 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <View />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
