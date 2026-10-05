import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Alert, Button, Input, PasswordInput } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import { messageOf } from '@/hooks/useCart'
import {
  applyServerErrors,
  registerSchema,
  type RegisterValues,
} from '@/utils/validation'
import { ROUTES } from '@/utils/constants'

export default function RegisterPage() {
  const { register: createAccount, login } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      password_confirm: '',
    },
  })

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null)
    try {
      // Registration creates the Supabase auth user and the profiles row.
      await createAccount({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        phone: values.phone || undefined,
      })

      // Sign straight in so the new account lands in a usable session.
      try {
        await login(values.email, values.password)
        navigate(ROUTES.home, { replace: true })
      } catch {
        // Email confirmation may be required; that is not a failure.
        navigate(ROUTES.login, {
          replace: true,
          state: { justRegistered: true },
        })
      }
    } catch (error) {
      if (!applyServerErrors({ setError }, error)) {
        setFormError(messageOf(error, 'Could not create your account.'))
      }
    }
  }

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        One account for your bag, wishlist and every order.
      </p>

      {formError && (
        <Alert variant="danger" className="mt-6">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          autoFocus
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          hint="Optional. Used for delivery updates."
          error={errors.phone?.message}
          {...register('phone')}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Stored securely by Supabase Auth — never by this app."
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.password_confirm?.message}
          {...register('password_confirm')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} loadingText="Creating account…">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
