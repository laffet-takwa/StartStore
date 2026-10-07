import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/i18n/context'
import { LANGUAGES } from '@/i18n/index'
import { LOGO_IMAGE } from '@/utils/images'
import { Button } from '@/components/ui'
import { Globe } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const logoVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

interface LanguageScreenProps {
  onComplete: () => void
}

export function LanguageScreen({ onComplete }: LanguageScreenProps) {
  const { t, setLanguage } = useI18n()

  const handleSelect = (lang: 'ar' | 'fr' | 'en') => {
    setLanguage(lang)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-info/10 blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-md mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex flex-col items-center mb-10" variants={logoVariants}>
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-xl shadow-primary/20 mb-4">
            <img
              src={LOGO_IMAGE}
              alt="STAR STORE"
              className="h-full w-full object-contain"
              loading="eager"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('auth.welcomeToStarStore')}
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5">{t('auth.chooseLanguage')}</p>
        </motion.div>

        <motion.div className="space-y-3" variants={containerVariants}>
          <AnimatePresence>
            {LANGUAGES.map((lang) => (
              <motion.div key={lang.code} variants={itemVariants}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start gap-3 h-14 text-base border-slate-300 hover:border-primary hover:bg-primary/5 dark:border-slate-600 dark:hover:border-primary dark:hover:bg-dark-primary-light/20"
                  onClick={() => handleSelect(lang.code)}
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {lang.code === 'ar' ? '🇹🇳' : lang.code === 'fr' ? '🇫🇷' : '🇬🇧'}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{lang.native}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-normal">{lang.label}</span>
                  </div>
                  <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400 ml-auto opacity-80" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-10" variants={itemVariants}>
          STAR STORE v1.0
        </motion.p>
      </motion.div>
    </div>
  )
}
