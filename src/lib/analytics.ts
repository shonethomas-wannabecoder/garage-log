import { supabase } from './supabase'

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      properties,
      user_id: session?.user?.id ?? null,
    })
  } catch {
    // Analytics should never break the app.
  }
}
