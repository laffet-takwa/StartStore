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
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="au cd st" style={{ boxShadow: 'var(--sh)' }}>
      <img className="trl" src={LOGO_IMAGE} alt="STAR STORE" />
      <h2 className="hf" style={{ textAlign: 'center', fontSize: 22 }}>
        {t('auth.login')}
      </h2>
      {error && <p className="msg er">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          {t('auth.email')}
          <input className="in" type="email" autoComplete="email" placeholder="you@starstore.tn" {...register('email')} />
        </label>
        {errors.email && <p className="msg er" style={{ marginTop: 6 }}>{errors.email.message}</p>}

        <label>
          {t('auth.password')}
          <input className="in" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </label>
        {errors.password && <p className="msg er" style={{ marginTop: 6 }}>{errors.password.message}</p>}

        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: 14 }}>
          {loading ? t('auth.signingIn') : t('auth.login')}
        </button>
      </form>
      <p className="mu" style={{ marginTop: 14 }}>
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="lk">{t('auth.register')}</Link>
      </p>
    </div>
  )
}
