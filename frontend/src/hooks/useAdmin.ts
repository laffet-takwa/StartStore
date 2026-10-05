import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { messageOf } from '@/hooks/useCart'
import { adminProductService, categoryService, productService } from '@/services/product.service'
import { adminDashboardService, adminUserService } from '@/services/user.service'
import { toast } from '@/store/uiStore'
import type { UserRole } from '@/types'
import { queryKeys } from '@/lib/queryClient'

/* -------------------------------------------------------------------------- */
/* Reads                                                                        */
/* -------------------------------------------------------------------------- */

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: adminDashboardService.get,
    staleTime: 30_000,
  })
}

export function useAdminProductSummary() {
  return useQuery({
    queryKey: queryKeys.adminProductSummary,
    queryFn: adminProductService.summary,
    staleTime: 60_000,
  })
}

export function useAdminUsers(params?: {
  role?: UserRole
  search?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => adminUserService.list(params),
    staleTime: 30_000,
  })
}

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: () => categoryService.list(),
    staleTime: 30_000,
  })
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                    */
/* -------------------------------------------------------------------------- */

function useInvalidateDashboard() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] })
  }
}

export function useSetUserRole() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      adminUserService.setRole(id, role),
    onSuccess: () => {
      invalidate()
      toast.success('Role updated')
    },
    onError: (error) => toast.error('Could not change role', messageOf(error)),
  })
}

export function useAdminUpdateUser() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      full_name?: string | null
      phone?: string | null
      role?: UserRole
    }) => adminUserService.update(id, payload),
    onSuccess: () => {
      invalidate()
      toast.success('Profile updated')
    },
    onError: (error) => toast.error('Could not update profile', messageOf(error)),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Category created')
    },
    onError: (error) => toast.error('Could not create category', messageOf(error)),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof categoryService.update>[1]) =>
      categoryService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Category updated')
    },
    onError: (error) => toast.error('Could not update category', messageOf(error)),
  })
}

/** Soft delete: the row survives so historic orders keep their references. */
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Category archived', 'Existing products are untouched.')
    },
    onError: (error) => toast.error('Could not archive category', messageOf(error)),
  })
}

/** Soft delete: the product is flagged inactive rather than removed. */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product archived', 'It is hidden from the storefront.')
    },
    onError: (error) => toast.error('Could not archive product', messageOf(error)),
  })
}
