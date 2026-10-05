import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2 } from 'lucide-react'

import { Button, Checkbox, IconButton, Input } from '@/components/common'
import { Badge } from '@/components/common/Display'
import { ConfirmDialog, Modal } from '@/components/common/Overlay'
import { cn } from '@/lib/cn'
import type { Address } from '@/types'
import { addressSchema, type AddressValues } from '@/utils/validation'

export interface AddressFormProps {
  /** Present when editing; omit to create. */
  address?: Address | null
  defaultValues?: Partial<AddressValues>
  onSubmit: (values: AddressValues) => Promise<void> | void
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  className?: string
}

/**
 * Address form.
 *
 * Mirrors the nullable columns on `public.addresses`; the client requires the
 * full set because an order cannot ship without it.
 */
export function AddressForm({
  address,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Save address',
  className,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: address?.full_name ?? defaultValues?.full_name ?? '',
      phone: address?.phone ?? defaultValues?.phone ?? '',
      address_line: address?.address_line ?? defaultValues?.address_line ?? '',
      city: address?.city ?? defaultValues?.city ?? '',
      postal_code: address?.postal_code ?? defaultValues?.postal_code ?? '',
      country: (address?.country ?? defaultValues?.country ?? 'US').toUpperCase(),
      is_default: address?.is_default ?? defaultValues?.is_default ?? false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <Input
        label="Street address"
        autoComplete="address-line1"
        placeholder="1 Analytical Engine Way"
        error={errors.address_line?.message}
        {...register('address_line')}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="City"
          autoComplete="address-level2"
          placeholder="London"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Postal code"
          autoComplete="postal-code"
          placeholder="EC1A 1BB"
          error={errors.postal_code?.message}
          {...register('postal_code')}
        />
        <Input
          label="Country"
          autoComplete="country"
          placeholder="GB"
          maxLength={2}
          error={errors.country?.message}
          {...register('country')}
        />
      </div>

      <Checkbox
        label="Set as my default address"
        description="Pre-selected at checkout."
        checked={watch('is_default')}
        onChange={(event) =>
          setValue('is_default', event.target.checked, { shouldDirty: true })
        }
      />

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={!isDirty && !address}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

/** Single address row with edit/delete actions. */
export function AddressRow({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  className,
}: {
  address: Address
  onEdit: () => void
  onDelete: () => void
  onSetDefault?: () => void
  className?: string
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <li className={cn('flex gap-4 p-5', className)}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{address.full_name || 'Address'}</p>
            {address.is_default && <Badge variant="brand">Default</Badge>}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{address.address_line}</p>
          <p className="text-sm leading-relaxed text-ink-muted">
            {[address.city, address.postal_code].filter(Boolean).join(', ')}
            {address.country ? ` · ${address.country}` : ''}
          </p>
          {address.phone && (
            <p className="mt-1 text-xs text-ink-faint">{address.phone}</p>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-1">
          {!address.is_default && onSetDefault && (
            <IconButton label="Set as default" size="sm" onClick={onSetDefault}>
              <span className="text-xs font-medium">Default</span>
            </IconButton>
          )}
          <IconButton label="Edit address" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Delete address"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-ink-faint hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </li>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this address?"
        description={`${address.address_line} will be removed from your address book. Orders already placed keep their saved copy.`}
        confirmLabel="Delete address"
        variant="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onDelete()
        }}
      />
    </>
  )
}

/** Modal wrapper so callers do not each manage open state. */
export function AddressFormModal({
  open,
  onClose,
  address,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onClose: () => void
  address?: Address | null
  onSubmit: (values: AddressValues) => Promise<void> | void
  isSubmitting?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={address ? 'Edit address' : 'Add a new address'}
      description={
        address
          ? 'Update the details for this delivery address.'
          : 'Saved addresses can be selected again at checkout.'
      }
    >
      <AddressForm
        address={address}
        onSubmit={async (values) => {
          await onSubmit(values)
          onClose()
        }}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  )
}
