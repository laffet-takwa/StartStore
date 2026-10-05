import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound } from 'lucide-react'

import { Alert, Button, Input, PasswordInput } from '@/components/common'
import { authService } from '@/services/auth.service'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { messageOf } from '@/hooks/useCart'
import { applyServerErrors, loginSchema, type LoginValues } from '@/utils/validation'
import { ROUTES } from '@/utils/constants'

interface LocationState {
  from?: string
  justRegistered?: boolean
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from ?? ROUTES.home

  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(
    state?.justRegistered
      ? 'Account created. Check your inbox if confirmation is required, then sign in.'
      : null,
  )

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    try {
      // Supabase Auth verifies the credential; Django then trusts the token.
      const user = await login(values.email, values.password)
      navigate(user.role === 'admin' ? ROUTES.admin.dashboard : redirectTo, { replace: true })
    } catch (error) {
      if (!applyServerErrors({ setError }, error)) {
        setFormError(messageOf(error, 'Could not sign in.'))
      }
    }
  }

  const useDjangoSignIn = async (values: LoginValues) => {
    setFormError(null)
    try {
      const result = await authService.login(values.email, values.password)
      navigate(
        result.user.role === 'admin' ? ROUTES.admin.dashboard : redirectTo,
        { replace: true },
      )
    } catch (error) {
      if (!applyServerErrors({ setError }, error)) {
        setFormError(messageOf(error, 'Could not sign in.'))
      }
    }
  }

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Sign in to your bag, wishlist and order history.
      </p>

      {notice && (
        <Alert variant="success" className="mt-6">
          {notice}
        </Alert>
      )}
      {formError && (
        <Alert variant="danger" className="mt-6">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Signing in…"
        >
          Sign in
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        </Button>
      </form>

      {/* Alternative for deployments without a browser Supabase client. */}
      {isSupabaseConfigured() ? (
        <details className="mt-6 rounded-xl border border-zinc-200 bg-surface px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-ink-muted">
            Trouble signing in? Try the API sign-in
          </summary>
          <p className="mt-2 text-2xs leading-relaxed text-ink-muted">
            Supabase verifies your password either way. This path asks Django to
            exchange it for a rotating token pair instead.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            leftIcon={<KeyRound className="h-4 w-4" />}
            disabled={isSubmitting}
            onClick={() => void handleSubmit(useDjangoSignIn)()}
          >
            Sign in through Django
          </Button>
        </details>
      ) : (
        <Alert variant="warning" className="mt-6">
          Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to enable sign-in.
        </Alert>
      )}

      <button
        type="button"
        onClick={() => setFormError('Password recovery is not available yet.')}
        className="mt-6 w-full text-left text-xs font-medium text-brand-700 hover:underline"
      >
        Forgot your password?
      </button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to StartStore?{' '}
        <Link to={ROUTES.register} className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

export { getSupabaseClient }
