import { z } from 'zod'

import { ApiError } from '@/services/api'

/* -------------------------------------------------------------------------- */
/* Primitives                                                                   */
/* -------------------------------------------------------------------------- */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')

/**
 * Deliberately permissive: Supabase Auth owns password policy, and Django never
 * sees the password, so the frontend only enforces a sane floor and lets the
 * authoritative check happen server-side.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'That password is too long')

/** Accepts `+15551234567`, `07700 900123`, `555-1234`. */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(32, 'That phone number is too long')
  .regex(/^\+?[0-9][0-9\s\-().]{5,30}[0-9]$/, 'Enter a valid phone number')

export const nameSchema = z.string().trim().min(2, 'Enter your name').max(150)

export const countryCodeSchema = z
  .string()
  .trim()
  .length(2, 'Use a 2 letter country code, e.g. GB')
  .regex(/^[A-Za-z]{2}$/, 'Use a 2 letter country code, e.g. GB')
  .transform((value) => value.toUpperCase())

/* -------------------------------------------------------------------------- */
/* Auth                                                                         */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: nameSchema,
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    password: passwordSchema,
    password_confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.password_confirm, {
    path: ['password_confirm'],
    message: 'Passwords do not match',
  })
export type RegisterValues = z.infer<typeof registerSchema>

export const profileSchema = z.object({
  full_name: nameSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  avatar_url: z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value === '' || /^https?:\/\//.test(value), {
      message: 'Enter a full image URL',
    })
    .optional()
    .or(z.literal('')),
})

/**
 * Declared explicitly rather than inferred: every field is optional-or-empty, and
 * pinning the shape keeps react-hook-form's generics honest.
 */
export interface ProfileValues {
  full_name: string
  phone?: string
  avatar_url?: string
}

/* -------------------------------------------------------------------------- */
/* Addresses                                                                    */
/* -------------------------------------------------------------------------- */

/** Matches the nullable columns on `public.addresses`. */
export const addressSchema = z.object({
  full_name: nameSchema,
  phone: phoneSchema,
  address_line: z.string().trim().min(4, 'Enter your street address').max(500),
  city: z.string().trim().min(1, 'Enter your city').max(120),
  postal_code: z.string().trim().min(2, 'Enter your postal code').max(32),
  country: countryCodeSchema,
  is_default: z.boolean().default(false),
})
export type AddressValues = z.infer<typeof addressSchema>

/* -------------------------------------------------------------------------- */
/* Products (admin)                                                             */
/* -------------------------------------------------------------------------- */

const priceSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value !== '' && !Number.isNaN(Number(value)), 'Enter a price')
  .refine((value) => Number(value) > 0, 'Price must be greater than zero')

const optionalMoneySchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => (value === undefined || value === '' ? null : String(value).trim()))
  .refine((value) => value === null || !Number.isNaN(Number(value)), 'Enter a valid amount')
  .refine((value) => value === null || Number(value) > 0, 'Amount must be greater than zero')

/** Empty optional text becomes `null`, which the API columns accept. */
const nullableText = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) =>
    value === undefined || value === '' ? null : String(value).trim(),
  )

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter a product name').max(200),
    /** Empty means uncategorised, which the nullable FK allows. */
    category_id: z
      .string()
      .uuid('Choose a category')
      .optional()
      .or(z.literal(''))
      .transform((value) => (value ? value : null)),
    sku: z
      .string()
      .trim()
      .max(32)
      .regex(/^[A-Za-z0-9][A-Za-z0-9\-_]*$/, 'Letters, numbers, hyphen and underscore only')
      .optional()
      .or(z.literal(''))
      .transform((value) => (value ? value : null)),
    price: priceSchema,
    discount_price: optionalMoneySchema,
    stock: z.coerce
      .number({ invalid_type_error: 'Enter the stock level' })
      .int('Use a whole number')
      .min(0, 'Stock cannot be negative')
      .max(1_000_000, 'That is more stock than the store can hold'),
    description: nullableText,
    image_url: nullableText
      .refine((value) => value === null || /^https?:\/\//.test(value), {
        message: 'Enter a full image URL',
      })
      .refine((value) => value === null || value.length <= 1000, {
        message: 'That URL is too long',
      }),
    is_active: z.boolean().default(true),
  })
  .refine(
    (values) => values.discount_price === null || Number(values.discount_price) < Number(values.price),
    {
      path: ['discount_price'],
      message: 'The discount price must be lower than the list price',
    },
  )
export type ProductFormValues = z.infer<typeof productFormSchema>

/* -------------------------------------------------------------------------- */
/* Category (admin)                                                             */
/* -------------------------------------------------------------------------- */

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name').max(120),
  description: nullableText.refine((value) => value === null || value.length <= 2000, {
    message: 'That description is too long',
  }),
  image_url: nullableText.refine(
    (value) => value === null || /^https?:\/\//.test(value),
    { message: 'Enter a full image URL' },
  ),
  is_active: z.boolean().default(true),
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>

/* -------------------------------------------------------------------------- */
/* Checkout                                                                     */
/* -------------------------------------------------------------------------- */

export const checkoutInfoSchema = z.object({
  full_name: nameSchema,
  phone: phoneSchema,
})
export type CheckoutInfoValues = z.infer<typeof checkoutInfoSchema>

export const newsletterSchema = z.object({ email: emailSchema })
export type NewsletterValues = z.infer<typeof newsletterSchema>

/* -------------------------------------------------------------------------- */
/* Error mapping                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Map an `ApiError` onto react-hook-form field errors.
 *
 * The backend returns `{ error: { details: { field: [messages] } } }`, so a
 * server-side validation failure lands on the exact input that caused it rather
 * than as a banner.
 */
export function applyServerErrors<T extends { setError: (name: never, error: never) => void }>(
  form: T,
  error: unknown,
): boolean {
  if (!(error instanceof ApiError)) return false
  const fieldErrors = error.fieldErrors
  const names = Object.keys(fieldErrors)
  if (!names.length) return false

  for (const name of names) {
    // Cast is required because react-hook-form's typed field names are narrower
    // than the backend's free-form error keys.
    ;(form.setError as unknown as (key: string, err: { message: string }) => void)(name, {
      message: fieldErrors[name][0],
    })
  }
  return true
}
