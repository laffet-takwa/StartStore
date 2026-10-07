import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Language, Direction } from './index'
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from './index'
import en from './en.json'
import fr from './fr.json'
import ar from './ar.json'

const translations = { en, fr, ar }

type I18nContextValue = {
  language: Language
  direction: Direction
  t: (key: string, params?: Record<string, string | number>) => string
  setLanguage: (lang: Language) => void
  toggleDirection: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, obj) as string | undefined
}

function formatString(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in params) return String(params[key])
    return _
  })
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (stored && ['ar', 'fr', 'en'].includes(stored)) {
        return stored as Language
      }
    } catch {}
    return 'fr'
  })

  const direction = useMemo<Direction>(() => {
    const found = LANGUAGES.find((l: { code: string; dir: Direction }) => l.code === language)
    return found?.dir || 'ltr'
  }, [language])

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const dictionary = (translations as Record<Language, Record<string, unknown>>)[language] || translations.en
      const value = getNestedValue(dictionary as Record<string, unknown>, key)
      if (typeof value === 'string') {
        return formatString(value, params)
      }
      const fallback = getNestedValue(translations.en as Record<string, unknown>, key)
      return typeof fallback === 'string' ? formatString(fallback, params) : key
    }
  }, [language])

  const setLanguageAndPersist = (lang: Language) => {
    setLanguage(lang)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {}
  }

  useEffect(() => {
    document.documentElement.lang = language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en'
    document.documentElement.dir = direction
  }, [language, direction])

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      direction,
      t,
      setLanguage: setLanguageAndPersist,
      toggleDirection: () => {
        const next = direction === 'ltr' ? 'rtl' : 'ltr'
        const match = LANGUAGES.find((l: { dir: Direction; code: string }) => l.dir === next && l.code !== language)
        if (match) setLanguageAndPersist(match.code as Language)
      },
    }),
    [language, direction, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
