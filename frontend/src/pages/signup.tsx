import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Store, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  const [loading, setLoading] = useState(false)

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
    } catch {
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-success/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-info/10 blur-3xl" />

      <div className="relative w-full max-w-md px-4 animate-fade-in">
        <div className="bg-surface/80 rounded-2xl shadow-sm border border-slate-200 p-8 backdrop-blur">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-xl brand-gradient text-white flex items-center justify-center shadow-lg shadow-primary/30 animate-float">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">STAR STORE</h1>
              <p className="text-xs text-muted">Create an account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">First Name *</label>
                <input
                  {...register('first_name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-danger animate-slide-up">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Last Name *</label>
                <input
                  {...register('last_name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-danger animate-slide-up">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Email *</label>
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
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="+216 00 000 000"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-danger animate-slide-up">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Password *</label>
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

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Confirm Password *</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger animate-slide-up">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="sales">Sales</option>
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full brand-gradient text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60 transition-all btn-primary-glow flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
