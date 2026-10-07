import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { UserPlus, Lock, Mail, Phone, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'

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

  const inputClassName = (fieldName: string) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all ${
      errors[fieldName as keyof SignupForm]
        ? 'border-danger focus:ring-danger/20 focus:border-danger'
        : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
    } focus:outline-none focus:ring-2`

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-success/10 blur-3xl" />

      <div className="relative w-full max-w-md px-4 animate-fade-in">
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-900/50">
          <div className="p-8">
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('auth.register')}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">STAR STORE Manager</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.firstName')}</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      {...register('first_name')}
                      className={inputClassName('first_name') + ' pl-9'}
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-xs text-danger">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.lastName')}</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      {...register('last_name')}
                      className={inputClassName('last_name') + ' pl-9'}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-xs text-danger">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className={inputClassName('email') + ' pl-9'}
                    placeholder="you@starstore.tn"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('common.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    {...register('phone')}
                    className={inputClassName('phone') + ' pl-9'}
                    placeholder="+216 00 000 000"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-danger">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    {...register('password')}
                    className={inputClassName('password') + ' pl-9'}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    className={inputClassName('confirmPassword') + ' pl-9'}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('employees.role')}</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    {...register('role')}
                    className={`${inputClassName('role')} pl-9 appearance-none`}
                  >
                    <option value="sales">Sales</option>
                    <option value="technician">Technician</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {errors.role && (
                  <p className="text-xs text-danger">{errors.role.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full brand-gradient text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60 transition-all btn-primary-glow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {loading ? 'Creating account...' : t('auth.register')}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
