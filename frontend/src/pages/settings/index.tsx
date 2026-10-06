import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { Card, CardBody, Button } from '@/components/ui'
import { toast } from 'sonner'
import { Sun, Moon, Monitor, User, Shield } from 'lucide-react'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().or(z.literal('')),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const { theme, setTheme, resolved } = useTheme()
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'security'>('appearance')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-muted">Manage your preferences</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(['appearance', 'profile', 'security'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'appearance' && (
        <Card>
          <CardBody className="space-y-6">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Theme</p>
                <p className="text-xs text-muted">Choose how STAR STORE looks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    theme === t ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t === 'light' ? <Sun className="h-4 w-4" /> : t === 'dark' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    <p className="text-sm font-medium text-slate-900 capitalize">{t}</p>
                  </div>
                  <p className="text-xs text-muted">
                    {t === 'system' ? `Using ${resolved}` : t === 'light' ? 'Light mode' : 'Dark mode'}
                  </p>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'profile' && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Profile</p>
                  <p className="text-xs text-muted">Update your personal information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">First Name</label>
                  <input {...register('first_name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  {errors.first_name && <p className="text-xs text-danger">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Last Name</label>
                  <input {...register('last_name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  {errors.last_name && <p className="text-xs text-danger">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input type="email" {...register('email')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input {...register('phone')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardBody className="space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Security</p>
                <p className="text-xs text-muted">Password and session management</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">Password</p>
                  <p className="text-xs text-muted">Change your password</p>
                </div>
                <Button variant="outline" size="sm">Change Password</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">Sessions</p>
                  <p className="text-xs text-muted">Manage active sessions</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
