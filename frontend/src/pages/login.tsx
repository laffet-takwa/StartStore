import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'

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

      <div className="relative w-full max-w-md px-4 animate-fade-in">
        <div className="bg-surface/80 rounded-2xl shadow-sm border border-slate-200 p-8 backdrop-blur">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
              <img
                src={LOGO_IMAGE}
                alt="STAR STORE"
                className="h-full w-full object-contain"
                loading="eager"
              />
            </div>
             <div className="text-center">
               <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('auth.welcomeBack')}</h1>
               <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">STAR STORE Manager</p>
             </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.email')}</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-dark-surface dark:border-slate-700 dark:text-slate-100"
                placeholder="you@starstore.tn"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger animate-slide-up">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.password')}</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-dark-surface dark:border-slate-700 dark:text-slate-100"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-danger animate-slide-up">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full brand-gradient text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60 transition-all btn-primary-glow"
            >
              {loading ? t('auth.signingIn') : t('auth.login')}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            STAR STORE MANAGER v1.0
          </p>
        </div>
      </div>
    </div>
  )
}