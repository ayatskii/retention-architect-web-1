import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { I18nProvider } from './context/I18nContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WinsAI from './components/WinsAI'
import Overview    from './pages/Overview'
import Segments    from './pages/Segments'
import Diagnostics from './pages/Diagnostics'
import Model       from './pages/Model'
import StrategyLab from './pages/StrategyLab'
import TaskDetail  from './pages/TaskDetail'
import { clsx } from 'clsx'

const pages = {
  overview:    Overview,
  segments:    Segments,
  diagnostics: Diagnostics,
  model:       Model,
  strategyLab: StrategyLab,
  taskDetail:  TaskDetail,
}

function AppShell() {
  const [activePage, setActivePage] = useState('overview')
  const [activeTaskId, setActiveTaskId] = useState(null)
  const { isDark } = useTheme()
  const Page = pages[activePage] || Overview

  const navigate = (page, taskId = null) => {
    setActivePage(page)
    setActiveTaskId(taskId)
  }

  return (
    <div className={clsx(
      'min-h-screen transition-colors duration-300',
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900',
    )}>
      {/* Ambient radial glow (dark only) */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: [
              'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(204,255,0,0.04) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 30% at 100% 100%, rgba(0,229,255,0.03) 0%, transparent 70%)',
            ].join(','),
          }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activePage={activePage} onNavigate={navigate} />

        <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage === 'taskDetail' ? `taskDetail-${activeTaskId}` : activePage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <Page onNavigate={navigate} activeTaskId={activeTaskId} />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {/* Floating AI Widget — always present, z-50 */}
      <WinsAI />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </ThemeProvider>
  )
}
