import { del, get, patch, post } from './api'
import type { Address, AddressInput, Paginated } from '@/types'

export const addressService = {
  list: (params?: { is_default?: boolean; city?: string; search?: string }) =>
    get<Paginated<Address>>('/addresses/', params),

  get: (id: string) => get<Address>(`/addresses/${id}/`),

  /** The first address saved automatically becomes the default. */
  create: (payload: Partial<AddressInput>) => post<Address>('/addresses/', payload),

  update: (id: string, payload: Partial<AddressInput>) =>
    patch<Address>(`/addresses/${id}/`, payload),

  /** Demotes whichever address was previously default. */
  setDefault: (id: string) => post<Address>(`/addresses/${id}/set-default/`),

  remove: (id: string) => del<void>(`/addresses/${id}/`),
}

export type AddressService = typeof addressService
