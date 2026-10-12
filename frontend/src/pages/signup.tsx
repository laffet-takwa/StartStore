import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
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
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setError('')
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
      setError('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="au cd st" style={{ boxShadow: 'var(--sh)' }}>
      <img className="trl" src={LOGO_IMAGE} alt="STAR STORE" />
      <h2 className="hf" style={{ textAlign: 'center', fontSize: 22 }}>
        {t('auth.register')}
      </h2>
      {error && <p className="msg er">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="row" style={{ gap: 10 }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ marginTop: 10 }}>{t('auth.firstName')}
              <input className="in" style={{ width: '100%', marginTop: 4 }} placeholder="John" {...register('first_name')} />
            </label>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ marginTop: 10 }}>{t('auth.lastName')}
              <input className="in" style={{ width: '100%', marginTop: 4 }} placeholder="Doe" {...register('last_name')} />
            </label>
          </div>
        </div>
        {(errors.first_name || errors.last_name) && (
          <p className="msg er" style={{ marginTop: 6 }}>{errors.first_name?.message || errors.last_name?.message}</p>
        )}

        <label>{t('auth.email')}
          <input className="in" type="email" autoComplete="email" placeholder="you@starstore.tn" {...register('email')} />
        </label>
        {errors.email && <p className="msg er" style={{ marginTop: 6 }}>{errors.email.message}</p>}

        <label>{t('common.phone')}
          <input className="in" placeholder="+216 00 000 000" {...register('phone')} />
        </label>

        <label>{t('auth.password')}
          <input className="in" type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
        </label>
        {errors.password && <p className="msg er" style={{ marginTop: 6 }}>{errors.password.message}</p>}

        <label>{t('auth.confirmPassword')}
          <input className="in" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirmPassword')} />
        </label>
        {errors.confirmPassword && <p className="msg er" style={{ marginTop: 6 }}>{errors.confirmPassword.message}</p>}

        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: 14 }}>
          {loading ? 'Creating account...' : t('auth.register')}
        </button>
      </form>
      <p className="mu" style={{ marginTop: 14 }}>
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="lk">{t('auth.login')}</Link>
      </p>
    </div>
  )
}
