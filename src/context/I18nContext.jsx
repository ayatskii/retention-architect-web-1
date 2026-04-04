import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('wins-lang') || 'EN')

  const t = translations[lang] || translations.EN

  const changeLang = (l) => {
    setLang(l)
    localStorage.setItem('wins-lang', l)
  }

  return (
    <I18nContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
