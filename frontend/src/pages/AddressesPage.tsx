import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus } from 'lucide-react'

import { Button } from '@/components/common'
import { Alert, EmptyState, PageLoader } from '@/components/common/Feedback'
import { AddressForm, AddressRow } from '@/components/checkout/AddressForm'
import { Card } from '@/components/common/Display'
import { Container, Section } from '@/components/layout/Primitives'
import { useAddresses } from '@/hooks/useUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messageOf } from '@/hooks/useCart'
import { addressService } from '@/services/address.service'
import { toast } from '@/store/uiStore'
import { queryKeys } from '@/lib/queryClient'
import type { Address } from '@/types'
import { pluralize } from '@/utils/format'

export default function AddressesPage() {
  useDocumentTitle('Your addresses — StartStore')

  const { data, isLoading, isError, error, refetch } = useAddresses()
  const queryClient = useQueryClient()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.addresses })

  const createMutation = useMutation({
    mutationFn: addressService.create,
    onSuccess: () => {
      void invalidate()
      setCreating(false)
      toast.success('Address saved')
    },
    onError: (err) => toast.error('Could not save address', messageOf(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Address>) =>
      addressService.update(id, payload),
    onSuccess: () => {
      void invalidate()
      toast.success('Address updated')
    },
    onError: (err) => toast.error('Could not update address', messageOf(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressService.remove(id),
    onSuccess: () => {
      void invalidate()
      toast.success('Address removed')
    },
    onError: (err) => toast.error('Could not remove address', messageOf(err)),
  })

  const defaultMutation = useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onSuccess: () => {
      void invalidate()
      toast.success('Default address updated')
    },
    onError: (err) => toast.error('Could not update default', messageOf(err)),
  })

  const addresses = data?.results ?? []

  return (
    <Section>
      <Container size="narrow">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Your addresses
            </h1>
            {!isLoading && data && (
              <p className="mt-1.5 text-sm text-ink-muted">
                {pluralize(data.count, 'address', 'addresses')}
              </p>
            )}
          </div>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreating((open) => !open)}
          >
            Add address
          </Button>
        </div>

        {isError && (
          <Alert
            variant="danger"
            className="mt-8"
            title="We could not load your addresses"
            action={
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          >
            {error instanceof Error ? error.message : 'Please try again.'}
          </Alert>
        )}

        {creating && (
          <Card className="mt-8 animate-slide-up">
            <div className="px-5 py-5">
              <h2 className="mb-4 text-base font-semibold tracking-tight text-ink">
                New address
              </h2>
              <AddressForm
                onSubmit={async (values) => {
                  await createMutation.mutateAsync(values)
                }}
                onCancel={() => setCreating(false)}
                isSubmitting={createMutation.isPending}
              />
            </div>
          </Card>
        )}

        {isLoading ? (
          <PageLoader label="Loading addresses" />
        ) : addresses.length === 0 && !creating ? (
          <EmptyState
            className="mt-10"
            icon={<MapPin className="h-5 w-5 text-ink-faint" aria-hidden />}
            title="No saved addresses"
            description="Save an address now and it will be ready at checkout."
            action={<Button onClick={() => setCreating(true)}>Add your first address</Button>}
          />
        ) : (
          <ul className="mt-8 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            {addresses.map((address) => (
              <AddressRow
                key={address.id}
                address={address}
                onEdit={() => setEditing(address)}
                onDelete={() => deleteMutation.mutate(address.id)}
                onSetDefault={() => defaultMutation.mutate(address.id)}
              />
            ))}
          </ul>
        )}

        {editing && (
          <Card className="mt-8 animate-slide-up">
            <div className="px-5 py-5">
              <h2 className="mb-4 text-base font-semibold tracking-tight text-ink">
                Edit address
              </h2>
              <AddressForm
                address={editing}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editing.id, ...values })
                  setEditing(null)
                }}
                onCancel={() => setEditing(null)}
                isSubmitting={updateMutation.isPending}
                submitLabel="Save changes"
              />
            </div>
          </Card>
        )}
      </Container>
    </Section>
  )
}
