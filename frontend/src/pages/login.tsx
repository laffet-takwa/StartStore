import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Store } from 'lucide-react'
import loginBg from '/images/dell.jpg'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
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

      <div className="absolute inset-0 opacity-5">
        <img src={loginBg} alt="STAR STORE" className="w-full h-full object-cover" />
      </div>

      <div className="relative w-full max-w-md px-4 animate-fade-in">
        <div className="bg-surface/80 rounded-2xl shadow-sm border border-slate-200 p-8 backdrop-blur">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-xl brand-gradient text-white flex items-center justify-center shadow-lg shadow-primary/30 animate-float">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">STAR STORE</h1>
              <p className="text-xs text-muted">Manager Login</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="you@starstore.tn"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger animate-slide-up">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            STAR STORE MANAGER v1.0
          </p>
        </div>
      </div>
    </div>
  )
}