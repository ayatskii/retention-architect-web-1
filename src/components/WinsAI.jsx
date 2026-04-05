import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Zap, Trash2, ChevronDown, Bot, User, ShieldCheck } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'
import { getAccent, accentFg, accentAlpha, accentGlow } from '../lib/theme'
import { consultAI } from '../services/api'
import { clsx } from 'clsx'

// ── Typing dots animation ───────────────────────
function ThinkingDots({ isDark }) {
  const accent = getAccent(isDark)
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: accent }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}

// ── Single message bubble ───────────────────────
function Message({ msg, t, isDark }) {
  const isAI = msg.role === 'ai'
  const accent = getAccent(isDark)
  const fg     = accentFg(isDark)
  const [execDone, setExecDone] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  const handleExec = () => {
    setExecDone(true)
    setTimeout(() => setExecDone(false), 3000)
  }
  const handleReport = () => {
    setReportDone(true)
    setTimeout(() => setReportDone(false), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={clsx('flex gap-2.5', isAI ? 'items-start' : 'items-start flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[0.6rem] font-black',
        isAI
          ? 'text-black'
          : isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60',
      )}
        style={isAI ? { background: accent, color: fg, boxShadow: accentGlow(isDark, 'sm') } : {}}
      >
        {isAI ? <Zap size={12} strokeWidth={3} /> : <User size={12} />}
      </div>

      <div className={clsx('flex flex-col gap-2 max-w-[82%]', !isAI && 'items-end')}>
        {/* Bubble */}
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-xs leading-relaxed',
            isAI
              ? isDark
                ? 'bg-[rgba(204,255,0,0.07)] border border-[rgba(204,255,0,0.15)] text-white/80'
                : 'bg-[rgba(100,163,13,0.08)] border border-[rgba(100,163,13,0.2)] text-black/70'
              : isDark
                ? 'bg-white/[0.07] border border-white/[0.1] text-white/80'
                : 'bg-black/[0.06] border border-black/[0.08] text-black/70',
          )}
        >
          {msg.content}

          {/* Suggestion quick replies */}
          {msg.isSuggestion && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => msg.onSuggestionClick?.(msg.content)}
                className="text-[0.58rem] font-bold px-2 py-1 rounded-lg transition-colors"
                style={{ background: accentAlpha(isDark, 0.15), color: accent, border: `1px solid ${accentAlpha(isDark, 0.25)}` }}
              >
                {t.ai.askAbout}
              </button>
            </div>
          )}
        </div>

        {/* AI action buttons */}
        {isAI && msg.showActions && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExec}
              className={clsx(
                'flex items-center gap-1.5 text-[0.62rem] font-bold px-3 py-1.5 rounded-lg transition-all duration-200',
                execDone
                  ? 'text-black'
                  : 'hover:opacity-80',
              )}
              style={{
                background: execDone ? accent : accentAlpha(isDark, 0.15),
                color: execDone ? fg : accent,
                border: `1px solid ${accentAlpha(isDark, 0.3)}`,
                boxShadow: execDone ? accentGlow(isDark) : 'none',
              }}
            >
              <Zap size={10} strokeWidth={3} />
              {execDone ? t.ai.executed : t.ai.executeStrategy}
            </button>
            <button
              onClick={handleReport}
              className={clsx(
                'flex items-center gap-1.5 text-[0.62rem] font-bold px-3 py-1.5 rounded-lg transition-all duration-200',
              )}
              style={{
                background: reportDone
                  ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                  : 'transparent',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              {reportDone ? t.ai.sent : t.ai.sendReport}
            </button>
          </div>
        )}

        {/* Secure badge + timestamp row */}
        <div className="flex items-center gap-2">
          {isAI && msg.secure && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <ShieldCheck size={8} style={{ color: '#22c55e' }} />
              <span className="text-[0.46rem] font-bold" style={{ color: '#22c55e' }}>{t.ai.anonymizedBadge}</span>
            </div>
          )}
          <span className={clsx('text-[0.52rem] px-1', isDark ? 'text-white/20' : 'text-black/25')}>
            {msg.time}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Chat Widget ────────────────────────────
export default function WinsAI() {
  const { t, lang } = useI18n()
  const { isDark } = useTheme()
  const accent = getAccent(isDark)
  const fg     = accentFg(isDark)
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [messages, setMessages] = useState([])
  const [fabHovered, setFabHovered] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Build initial suggestion messages whenever language changes
  useEffect(() => {
    const suggestions = (t.ai.suggestions || []).map((s, i) => ({
      id: `sug-${i}`,
      role: 'ai',
      content: s,
      time: now(),
      isSuggestion: true,
      showActions: false,
      onSuggestionClick: (txt) => handleSend(txt),
    }))
    setMessages(suggestions)
    setMsgIdx(0)
  }, [lang])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 160)
    }
  }, [open, minimized])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now(), time: now(), ...msg }])
  }, [])

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || thinking) return
    setInput('')

    addMessage({ role: 'user', content: msg })
    setThinking(true)

    // ── Route through Secure AI Gateway (backend /ai/consult) ────
    const chatHistory = messages
      .filter(m => !m.isSuggestion)
      .slice(-6)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

    const result = await consultAI({ message: msg, lang, history: chatHistory })

    if (result) {
      // Backend responded (real OpenAI or backend mock)
      addMessage({ role: 'ai', content: result.reply, showActions: true, secure: result.anonymized })
    } else {
      // Backend offline — use frontend mock responses
      await new Promise(r => setTimeout(r, 700 + Math.random() * 350))
      const responses = t.ai.mockResponses || []
      const reply = responses[msgIdx % responses.length] ||
        "I've analysed your query. Would you like me to run a deeper diagnostic scan?"
      setMsgIdx(i => i + 1)
      addMessage({ role: 'ai', content: reply, showActions: true, secure: false })
    }

    setThinking(false)
  }, [input, thinking, messages, msgIdx, t, lang, addMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const clearChat = () => {
    const suggestions = (t.ai.suggestions || []).map((s, i) => ({
      id: `sug-${i}`, role: 'ai', content: s, time: now(),
      isSuggestion: true, showActions: false,
    }))
    setMessages(suggestions)
    setMsgIdx(0)
  }

  return (
    <>
      {/* ── Floating toggle button (always visible) ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={() => setOpen(true)}
            onMouseEnter={() => setFabHovered(true)}
            onMouseLeave={() => setFabHovered(false)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-2xl text-sm font-black shadow-2xl overflow-hidden"
            style={{
              background: accent,
              color: fg,
              boxShadow: `${accentGlow(isDark, 'lg')}, 0 4px 24px rgba(0,0,0,0.4)`,
              width: fabHovered ? 'auto' : '48px',
              height: '48px',
              padding: fabHovered ? '0 16px' : '0',
              transition: 'width 0.25s ease, padding 0.25s ease',
            }}
            aria-label={t.ai.open}
          >
            {/* Pulse ring */}
            <span className="relative flex-shrink-0">
              <span className="absolute inset-0 rounded-full animate-ping"
                style={{ background: accentAlpha(isDark, 0.4) }} />
              <Zap size={16} strokeWidth={3} className="relative" />
            </span>
            {fabHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="ml-2.5 whitespace-nowrap"
              >
                {t.ai.title}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              maxHeight: minimized ? 'auto' : '560px',
              border: `1px solid ${accentAlpha(isDark, 0.3)}`,
              boxShadow: `${accentGlow(isDark, 'md')}, 0 20px 60px rgba(0,0,0,0.5)`,
              background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(252,252,252,0.97)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 border-b flex-shrink-0"
              style={{ borderColor: accentAlpha(isDark, 0.15), background: accentAlpha(isDark, 0.05) }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: accent, boxShadow: accentGlow(isDark) }}>
                <Zap size={14} color={fg} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black leading-none" style={{ color: accent }}>
                  {t.ai.title}
                </p>
                <p className={clsx('text-[0.58rem] mt-0.5', isDark ? 'text-white/35' : 'text-black/40')}>
                  {t.ai.subtitle}
                </p>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: accent, boxShadow: `0 0 4px ${accent}` }} />
                <span className="text-[0.52rem] font-bold" style={{ color: accent }}>{t.ai.live}</span>
              </div>

              {/* Secure Shield badge */}
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg"
                title={t.ai.anonymized}
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.25)',
                }}
              >
                <ShieldCheck size={10} style={{ color: '#22c55e' }} />
                <span className="text-[0.48rem] font-bold tracking-wide" style={{ color: '#22c55e' }}>
                  {t.ai.secureMode}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button onClick={clearChat}
                  className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    isDark ? 'text-white/25 hover:text-white/60 hover:bg-white/05' : 'text-black/25 hover:text-black/60 hover:bg-black/05')}>
                  <Trash2 size={13} />
                </button>
                <button onClick={() => setMinimized(v => !v)}
                  className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    isDark ? 'text-white/25 hover:text-white/60 hover:bg-white/05' : 'text-black/25 hover:text-black/60 hover:bg-black/05')}>
                  <ChevronDown size={13} className={clsx('transition-transform', minimized && 'rotate-180')} />
                </button>
                <button onClick={() => setOpen(false)}
                  className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    isDark ? 'text-white/25 hover:text-white/60 hover:bg-white/05' : 'text-black/25 hover:text-black/60 hover:bg-black/05')}>
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <AnimatePresence initial={false}>
              {!minimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
                  style={{ maxHeight: '360px' }}
                >
                  {messages.map(msg => (
                    <Message key={msg.id} msg={msg} t={t} isDark={isDark} />
                  ))}

                  {/* Thinking indicator */}
                  <AnimatePresence>
                    {thinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="flex items-center gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: accent }}>
                          <Zap size={12} color={fg} strokeWidth={3} />
                        </div>
                        <div className="rounded-2xl border"
                          style={{
                            background: accentAlpha(isDark, 0.07),
                            borderColor: accentAlpha(isDark, 0.15),
                          }}>
                          <ThinkingDots isDark={isDark} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={bottomRef} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input ── */}
            {!minimized && (
              <div className="flex-shrink-0 border-t px-3 py-3"
                style={{ borderColor: accentAlpha(isDark, 0.1) }}>

                {/* Quick Command Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    t.ai.quickCmd1,
                    t.ai.quickCmd2,
                    t.ai.quickCmd3,
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleSend(cmd)}
                      disabled={thinking}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.55rem] font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: accentAlpha(isDark, 0.08),
                        border: `1px solid ${accentAlpha(isDark, 0.22)}`,
                        color: accent,
                      }}
                    >
                      <Zap size={8} strokeWidth={3} />
                      {cmd}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.ai.placeholder}
                    className={clsx(
                      'flex-1 resize-none rounded-xl px-3 py-2.5 text-xs outline-none transition-all duration-200 leading-relaxed',
                      isDark
                        ? 'bg-white/[0.04] text-white placeholder-white/25 border border-white/[0.08]'
                        : 'bg-black/[0.04] text-black placeholder-black/30 border border-black/[0.08]',
                    )}
                    style={{ maxHeight: '80px' }}
                    onFocus={e => { e.target.style.borderColor = accentAlpha(isDark, 0.4) }}
                    onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                  />
                  <motion.button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || thinking}
                    whileTap={{ scale: 0.93 }}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                    style={{ background: accent, boxShadow: accentGlow(isDark, 'sm') }}
                  >
                    <Send size={14} color={fg} strokeWidth={2.5} />
                  </motion.button>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <ShieldCheck size={9} style={{ color: '#22c55e' }} />
                  <p className={clsx('text-[0.5rem]', isDark ? 'text-white/20' : 'text-black/25')}>
                    {t.ai.anonymized}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
