import { useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'

import {
  Avatar,
  Badge,
  Input,
  RoleBadge,
  Select,
} from '@/components/common'
import { ErrorState, NoResultsState, TableSkeleton } from '@/components/common/Feedback'
import {
  AdminPageHeader,
  TablePagination,
  TableWrapper,
  Td,
  Th,
  Tr,
} from '@/components/admin/DataTable'
import { useAdminUsers, useSetUserRole } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { USER_ROLES, type UserRole } from '@/types'
import { formatDate } from '@/utils/format'
import { ADMIN_PAGE_SIZE } from '@/utils/constants'

export default function AdminUsersPage() {
  useDocumentTitle('Users — StartStore admin')

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [page, setPage] = useState(1)

  const debounced = useDebouncedValue(search, 400)
  const { user: currentUser } = useAuth()
  const setRoleMutation = useSetUserRole()

  const { data, isLoading, isError, error, refetch } = useAdminUsers({
    search: debounced || undefined,
    role: role || undefined,
    page,
    page_size: ADMIN_PAGE_SIZE,
  })

  const users = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE))

  const resetFilters = () => {
    setSearch('')
    setRole('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Every profile synced from the authentication provider. Role controls access to the admin console."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            leadingIcon={<Search className="h-4 w-4" aria-hidden />}
            placeholder="Email, name or phone"
            aria-label="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="h-10"
          />
        </div>

        <div className="w-40">
          <Select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as UserRole | '')
              setPage(1)
            }}
            aria-label="Filter by role"
            placeholder="All roles"
            options={USER_ROLES.map((entry) => ({ value: entry, label: entry }))}
            className="h-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : isError ? (
          <ErrorState
            className="m-5"
            message={error instanceof Error ? error.message : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : users.length === 0 ? (
          <NoResultsState query={debounced} onClear={resetFilters} />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Phone</Th>
                <Th align="right">Orders</Th>
                <Th align="right">Joined</Th>
                <Th align="right">Role</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id
                return (
                  <Tr key={user.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} name={user.full_name ?? user.email} size={36} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {user.full_name?.trim() || 'Unnamed'}
                            {isSelf && (
                              <span className="ml-2 text-2xs font-medium uppercase tracking-wide text-brand-600">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-ink-muted">{user.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-xs">{user.phone || '—'}</Td>
                    <Td align="right" className="text-ink">
                      {user.order_count ?? 0}
                    </Td>
                    <Td align="right" className="text-xs">
                      {formatDate(user.created_at)}
                    </Td>
                    <Td align="right">
                      {isSelf ? (
                        <span title="You cannot change your own role">
                          <RoleBadge role={user.role} />
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={setRoleMutation.isPending}
                          aria-label={`Change role for ${user.email}`}
                          onChange={(event) =>
                            setRoleMutation.mutate({
                              id: user.id,
                              role: event.target.value as UserRole,
                            })
                          }
                          className="h-8 cursor-pointer rounded-lg border border-zinc-300 bg-white px-2 text-xs capitalize text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                        >
                          {USER_ROLES.map((entry) => (
                            <option key={entry} value={entry}>
                              {entry}
                            </option>
                          ))}
                        </select>
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </TableWrapper>
        )}

        {users.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            count={count}
            pageSize={ADMIN_PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-ink-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
        <p>
          Profiles are mirrored from the authentication provider. To deactivate an
          account, ban it there — there is no status column in this API, and
          deactivating it here would not revoke its sessions.
          <Badge variant="neutral" className="ml-1.5 align-middle">
            role is the only control
          </Badge>
        </p>
      </div>
    </div>
  )
}
