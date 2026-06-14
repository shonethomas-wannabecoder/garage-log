import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Attachment, LineItem, LineItemDraft, ServiceVisit } from '../types'

export function useVisits(vehicleId: string | null) {
  const [visits, setVisits] = useState<ServiceVisit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!vehicleId) {
      setVisits([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('service_visits')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('parse_status', 'confirmed')
      .order('service_date', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else setVisits((data ?? []) as ServiceVisit[])
    setLoading(false)
  }, [vehicleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { visits, loading, error, refresh }
}

export function useVisitDetail(visitId: string | undefined) {
  const [visit, setVisit] = useState<ServiceVisit | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!visitId) {
      setVisit(null)
      setLineItems([])
      setAttachments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [visitRes, itemsRes, attachRes] = await Promise.all([
      supabase.from('service_visits').select('*').eq('id', visitId).single(),
      supabase.from('line_items').select('*').eq('service_visit_id', visitId).order('sort_order'),
      supabase.from('attachments').select('*').eq('service_visit_id', visitId),
    ])

    if (visitRes.error) setError(visitRes.error.message)
    else setVisit(visitRes.data as ServiceVisit)

    setLineItems((itemsRes.data ?? []) as LineItem[])
    setAttachments((attachRes.data ?? []) as Attachment[])
    setLoading(false)
  }, [visitId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { visit, lineItems, attachments, loading, error, refresh }
}

export async function createVisitWithLines(
  vehicleId: string,
  visit: {
    service_date: string
    odometer: number | null
    shop_name: string | null
    invoice_number: string | null
    total_cents: number | null
    advisor_notes: string | null
  },
  lines: LineItemDraft[],
  file: File | null,
  householdId: string,
  userId: string,
): Promise<{ visitId: string | null; error: string | null }> {
  const { data: visitRow, error: visitError } = await supabase
    .from('service_visits')
    .insert({
      vehicle_id: vehicleId,
      ...visit,
      parse_status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by_user_id: userId,
    })
    .select()
    .single()

  if (visitError || !visitRow) {
    return { visitId: null, error: visitError?.message ?? 'Failed to create visit' }
  }

  const visitId = visitRow.id as string

  if (lines.length) {
    const { error: linesError } = await supabase.from('line_items').insert(
      lines.map((line, index) => ({
        service_visit_id: visitId,
        description: line.description,
        category: line.category,
        item_type: line.item_type,
        quantity: line.quantity,
        unit_price_cents: line.unit_price_cents,
        line_total_cents: line.line_total_cents,
        sort_order: index,
      })),
    )
    if (linesError) return { visitId, error: linesError.message }
  }

  if (file) {
    const path = `${householdId}/${visitId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('invoices').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) return { visitId, error: uploadError.message }

    const { error: attachError } = await supabase.from('attachments').insert({
      service_visit_id: visitId,
      storage_path: path,
      mime_type: file.type,
    })
    if (attachError) return { visitId, error: attachError.message }
  }

  return { visitId, error: null }
}

export async function searchVisits(
  vehicleId: string,
  query: string,
): Promise<{ visits: ServiceVisit[]; error: string | null }> {
  const q = query.trim().toLowerCase()
  if (!q) {
    const { data, error } = await supabase
      .from('service_visits')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('parse_status', 'confirmed')
      .order('service_date', { ascending: false })
    return { visits: (data ?? []) as ServiceVisit[], error: error?.message ?? null }
  }

  const { data: items, error: itemsError } = await supabase
    .from('line_items')
    .select('service_visit_id, description')
    .ilike('description', `%${q}%`)

  if (itemsError) return { visits: [], error: itemsError.message }

  const visitIds = [...new Set((items ?? []).map((i) => i.service_visit_id as string))]
  if (!visitIds.length) return { visits: [], error: null }

  const { data: visits, error: visitsError } = await supabase
    .from('service_visits')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('parse_status', 'confirmed')
    .in('id', visitIds)
    .order('service_date', { ascending: false })

  return { visits: (visits ?? []) as ServiceVisit[], error: visitsError?.message ?? null }
}
