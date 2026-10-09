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

const signupSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { signup } = useAuth()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setLoading(true)
    try {
      await signup({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || undefined,
        role: data.role || 'sales',
      })
      toast.success('Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-success/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md px-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-900/50">
          <div className="p-8">
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('auth.register')}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">STAR STORE Manager</p>
              </div>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('auth.firstName')} {...register('first_name')} error={errors.first_name?.message} placeholder="John" />
                <Input label={t('auth.lastName')} {...register('last_name')} error={errors.last_name?.message} placeholder="Doe" />
              </div>

              <Input label={t('auth.email')} type="email" {...register('email')} error={errors.email?.message} placeholder="you@starstore.tn" />
              <Input label={t('common.phone')} {...register('phone')} placeholder="+216 00 000 000" />

              <Input label={t('auth.password')} type="password" {...register('password')} error={errors.password?.message} placeholder="••••••••" />
              <Input label={t('auth.confirmPassword')} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="••••••••" />

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Creating account...' : t('auth.register')}
              </Button>
            </motion.form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400"
            >
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('auth.login')}
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
