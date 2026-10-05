import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Camera, Check, LogOut, ShieldCheck, User } from 'lucide-react'

import { Avatar, Button, Card, CardBody, CardHeader, Input, RoleBadge } from '@/components/common'
import { Alert, PageLoader } from '@/components/common/Feedback'
import { useAuth } from '@/hooks/useAuth'
import { useAddresses, useProfile } from '@/hooks/useUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messageOf } from '@/hooks/useCart'
import { applyServerErrors, profileSchema, type ProfileValues } from '@/utils/validation'
import { formatDate, pluralize } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

export default function ProfilePage() {
  useDocumentTitle('Your profile — StartStore')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, updateProfile, isResolving } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: addressData } = useAddresses()

  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  )

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', phone: '', avatar_url: '' },
  })

  // Seed the form from the API once it lands, so a refresh never wipes edits
  // the user has already typed.
  useEffect(() => {
    const source = profile ?? user
    if (!source) return
    reset({
      full_name: source.full_name ?? '',
      phone: source.phone ?? '',
      avatar_url: source.avatar_url ?? '',
    })
  }, [profile, user, reset])

  if (isResolving || (isLoading && !user)) {
    return <PageLoader label="Loading your profile" />
  }

  const denied = (location.state as { denied?: boolean } | null)?.denied
  const addressCount = addressData?.count ?? 0

  const onSubmit = async (values: ProfileValues) => {
    setFeedback(null)
    try {
      await updateProfile({
        full_name: values.full_name.trim(),
        phone: values.phone?.trim() || null,
        avatar_url: values.avatar_url?.trim() || null,
      })
      reset(values)
      setFeedback({ tone: 'success', message: 'Your profile has been updated.' })
    } catch (error) {
      if (!applyServerErrors({ setError }, error)) {
        setFeedback({ tone: 'error', message: messageOf(error) })
      }
    }
  }

  const signOut = async () => {
    await logout()
    navigate(ROUTES.home, { replace: true })
  }

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {denied && (
          <Alert variant="warning" className="mb-6">
            That area is for administrators. You are signed in as a customer.
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name ?? user?.email}
            size={72}
            className="ring-2 ring-white shadow-card"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {user?.full_name?.trim() || 'Your account'}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{user?.email}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <RoleBadge role={user?.role ?? 'customer'} />
              <span className="text-xs text-ink-faint">
                Member since {formatDate(user?.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink">
                <User className="h-4 w-4 text-ink-faint" aria-hidden />
                Personal details
              </h2>
            </CardHeader>
            <CardBody>
              {feedback && (
                <Alert
                  variant={feedback.tone === 'success' ? 'success' : 'danger'}
                  className="mb-5"
                >
                  {feedback.message}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Input
                  label="Full name"
                  autoComplete="name"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <Input
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  hint="Used for delivery updates only."
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Input
                  label="Avatar URL"
                  leadingIcon={<Camera className="h-4 w-4" aria-hidden />}
                  placeholder="https://…/avatar.jpg"
                  hint="Paste a link to an image."
                  error={errors.avatar_url?.message}
                  {...register('avatar_url')}
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
                    Save changes
                  </Button>
                  {isDirty && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        reset({
                          full_name: user?.full_name ?? '',
                          phone: user?.phone ?? '',
                          avatar_url: user?.avatar_url ?? '',
                        })
                      }
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardBody>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardBody className="space-y-4">
                <h2 className="text-sm font-semibold text-ink">Quick links</h2>
                <QuickLink
                  to={ROUTES.orders}
                  title="My orders"
                  detail="Track and cancel orders"
                />
                <QuickLink
                  to={ROUTES.addresses}
                  title="Addresses"
                  detail={
                    addressCount > 0
                      ? pluralize(addressCount, 'saved address', 'saved addresses')
                      : 'Add a delivery address'
                  }
                />
                <QuickLink to={ROUTES.wishlist} title="Wishlist" detail="Saved products" />
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                  Account security
                </h2>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
                  Your password is held by Supabase Auth and never reaches this app.
                  Sign out to revoke the session tokens issued to this device.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  leftIcon={<LogOut className="h-4 w-4" />}
                  onClick={() => void signOut()}
                >
                  Sign out
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 transition-all duration-150 hover:border-zinc-300 hover:bg-surface"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">{detail}</span>
      </span>
      <Check className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-brand-600" />
    </Link>
  )
}
