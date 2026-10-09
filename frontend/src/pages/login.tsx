import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'
import { Input, Button } from '@/components/ui'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-warning/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md px-4"
      >
        <div className="bg-surface/80 rounded-2xl shadow-sm border border-border p-8 backdrop-blur">
          <div className="flex flex-col items-center gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="h-14 w-14 rounded-xl overflow-hidden shadow-lg shadow-primary/20"
            >
              <img
                src={LOGO_IMAGE}
                alt="STAR STORE"
                className="h-full w-full object-contain"
                loading="eager"
              />
            </motion.div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('auth.welcomeBack')}</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">STAR STORE Manager</p>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <Input
              label={t('auth.email')}
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="you@starstore.tn"
            />

            <Input
              label={t('auth.password')}
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? t('auth.signingIn') : t('auth.login')}
            </Button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400"
          >
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500"
          >
            STAR STORE MANAGER v1.0
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
