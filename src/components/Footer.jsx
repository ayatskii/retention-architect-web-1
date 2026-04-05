import { Github, Zap } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { clsx } from 'clsx'

export default function Footer() {
  const { t } = useI18n()
  const { isDark } = useTheme()

  return (
    <footer className={clsx(
      'mt-20 border-t transition-colors duration-300',
      isDark ? 'border-white/[0.06] bg-black/60' : 'border-black/[0.06] bg-white/60',
    )}>
      {/* Top gradient line */}
      <div className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(204,255,0,0.4), transparent)' }} />

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#ccff00', boxShadow: '0 0 12px rgba(204,255,0,0.4)' }}>
              <Zap size={14} color="#000" strokeWidth={3} />
            </div>
            <div>
              <p className="text-base font-black" style={{ color: '#ccff00', letterSpacing: '-0.01em' }}>
                {t.footer.brand}
              </p>
              <p className={clsx('text-xs', isDark ? 'text-white/30' : 'text-black/40')}>
                {t.footer.subtitle}
              </p>
            </div>
          </div>

          {/* Center text */}
          <div className="text-center">
            <p className={clsx('text-sm font-semibold', isDark ? 'text-white/60' : 'text-black/60')}>
              {t.footer.text}{' '}
              <span className="font-black" style={{ color: '#ccff00' }}>
                {t.footer.event}
              </span>
            </p>
            <p className={clsx('text-xs mt-0.5', isDark ? 'text-white/25' : 'text-black/30')}>
              {t.footer.rights}
            </p>
            <p className={clsx('text-[0.5rem] mt-1.5', isDark ? 'text-white/18' : 'text-black/25')}>
              {t.footer.methodology}
            </p>
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/Altusha4/retention-architect-web"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200',
              isDark
                ? 'border-white/10 text-white/50 hover:text-white hover:border-white/30 bg-white/04'
                : 'border-black/10 text-black/50 hover:text-black hover:border-black/30 bg-black/04',
            )}
          >
            <Github size={14} />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
