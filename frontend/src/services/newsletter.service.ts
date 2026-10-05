/**
 * Newsletter sign-up.
 *
 * The Django API has no newsletter endpoint yet, so this fails loudly with a
 * typed error instead of pretending to succeed. The UI surfaces the message, and
 * this function is the single seam to replace with a real endpoint (or a Supabase
 * Edge Function) once one exists.
 */

import { ApiError } from './api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const newsletterService = {
  async subscribe(email: string): Promise<void> {
    if (!EMAIL_PATTERN.test(email.trim())) {
      throw new ApiError('Enter a valid email address.', 400, 'validation_error')
    }
    throw new ApiError(
      'Newsletter sign-up is not available yet. We will have it here soon.',
      501,
      'newsletter_not_configured',
    )
  },
}

export type NewsletterService = typeof newsletterService
