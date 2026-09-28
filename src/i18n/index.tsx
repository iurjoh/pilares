import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { EN } from './en'
import { setDateLocale } from './locale'

export type Lang = 'pt-BR' | 'en'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'pt-BR', label: 'Português (Brasil)' },
  { id: 'en', label: 'English' },
]
const STORAGE_KEY = 'pilares:lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'pt-BR' || saved === 'en') return saved
  } catch { /* storage unavailable */ }
  try {
    if (navigator.language && navigator.language.toLowerCase().startsWith('pt')) return 'pt-BR'
  } catch { /* ignore */ }
  return 'en'
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (msgid: string, vars?: Record<string, string | number>) => string
}

const fallback: I18nValue = { lang: 'pt-BR', setLang: () => {}, t: (s) => s }
const Ctx = createContext<I18nValue>(fallback)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
  useEffect(() => { document.documentElement.lang = lang; setDateLocale(lang) }, [lang])
  const setLang = (next: Lang) => {
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* storage unavailable */ }
  }
  const t = (msgid: string, vars?: Record<string, string | number>) => {
    let s = lang === 'en' ? (EN[msgid] ?? msgid) : msgid
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
    return s
  }
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useI18n() { return useContext(Ctx) }
