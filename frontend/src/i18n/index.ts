export type Language = 'ar' | 'fr' | 'en'
export type Direction = 'ltr' | 'rtl'

export const LANGUAGES: { code: Language; label: string; native: string; dir: Direction }[] = [
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
]

export const LANGUAGE_STORAGE_KEY = 'starstore-language'
export const THEME_STORAGE_KEY = 'starstore-theme'
