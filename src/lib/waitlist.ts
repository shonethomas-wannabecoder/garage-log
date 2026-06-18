import { supabase } from './supabase'
import type { WaitlistStatus } from '../types'

export function isWaitlistEnabled(): boolean {
  return import.meta.env.VITE_WAITLIST_ENABLED === 'true'
}

export async function joinWaitlist(
  email: string,
): Promise<{ ok: boolean; status?: WaitlistStatus; alreadyJoined?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('join_waitlist', { raw_email: email.trim() })

  if (error) return { ok: false, error: error.message }

  const row = data as {
    ok?: boolean
    status?: WaitlistStatus
    already_joined?: boolean
    error?: string
  } | null

  if (!row?.ok) return { ok: false, error: row?.error ?? 'Could not join waitlist' }

  return {
    ok: true,
    status: row.status,
    alreadyJoined: row.already_joined ?? false,
  }
}

export async function getWaitlistStatus(email: string): Promise<WaitlistStatus | null> {
  const { data, error } = await supabase.rpc('get_waitlist_status', { raw_email: email.trim() })
  if (error) return null
  return (data as WaitlistStatus | null) ?? null
}

export async function isWaitlistApproved(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_waitlist_approved', { raw_email: email.trim() })
  if (error) return false
  return Boolean(data)
}

export async function assertWaitlistApproved(email: string): Promise<string | null> {
  if (!isWaitlistEnabled()) return null

  const status = await getWaitlistStatus(email)
  if (status === 'approved') return null
  if (status === 'pending') {
    return 'Your email is on the waitlist. We’ll email you when your spot is approved.'
  }
  if (status === 'rejected') {
    return 'This email isn’t eligible for access right now.'
  }
  return 'Join the waitlist first — we’ll let you know when you can sign in.'
}
