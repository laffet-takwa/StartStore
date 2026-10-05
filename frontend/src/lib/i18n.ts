import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import ar from '@/locales/ar.json'

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
} as const

export type SupportedLanguage = keyof typeof resources

export const supportedLanguages: SupportedLanguage[] = ['en', 'fr', 'ar']

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
}

export const languageFlags: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  ar: '🇸🇦',
}

export const isRTL = (lang: SupportedLanguage): boolean => lang === 'ar'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'startstore_lang',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n