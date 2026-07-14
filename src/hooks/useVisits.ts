import { useCallback, useEffect, useState } from 'react'
import { useDemoData } from '../demo/DemoDataProvider'
import { supabase } from '../lib/supabase'
import type {
  Attachment,
  LineItem,
  LineItemDraft,
  ServiceCategory,
  ServiceVisit,
} from '../types'

export interface CategoryHistory {
  category: ServiceCategory
  visitId: string
  serviceDate: string
  odometer: number | null
  shopName: string | null
  advisorNotes: string | null
  descriptions: string[]
}

export function useCategoryHistory(vehicleId: string | null) {
  const demo = useDemoData()
  const [history, setHistory] = useState<Record<string, CategoryHistory>>({})
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demo) {
      setHistory(demo.categoryHistory)
      setLoading(false)
      return
    }
    if (!vehicleId) {
      setHistory({})
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('line_items')
      .select(
        'category, description, service_visits!inner(id, service_date, odometer, shop_name, advisor_notes, vehicle_id, parse_status)',
      )
      .eq('service_visits.vehicle_id', vehicleId)
      .eq('service_visits.parse_status', 'confirmed')

    const map: Record<string, CategoryHistory> = {}
    for (const row of (data ?? []) as unknown as Array<{
      category: ServiceCategory
      description: string
      service_visits: {
        id: string
        service_date: string
        odometer: number | null
        shop_name: string | null
        advisor_notes: string | null
      }
    }>) {
      const v = row.service_visits
      if (!v) continue
      const existing = map[row.category]
      if (!existing || v.service_date > existing.serviceDate) {
        map[row.category] = {
          category: row.category,
          visitId: v.id,
          serviceDate: v.service_date,
          odometer: v.odometer,
          shopName: v.shop_name,
          advisorNotes: v.advisor_notes,
          descriptions: [row.description],
        }
      } else if (v.id === existing.visitId) {
        existing.descriptions.push(row.description)
      }
    }
    setHistory(map)
    setLoading(false)
  }, [vehicleId, demo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { history, loading, refresh }
}

export function useVisits(vehicleId: string | null) {
  const demo = useDemoData()
  const [visits, setVisits] = useState<ServiceVisit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (demo) {
      setVisits(
        demo.confirmedVisits.filter((v) => !vehicleId || v.vehicle_id === vehicleId),
      )
      setLoading(false)
      setError(null)
      return
    }
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
  }, [vehicleId, demo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { visits, loading, error, refresh }
}

export function usePendingVisits(vehicleId: string | null) {
  const demo = useDemoData()
  const [visits, setVisits] = useState<ServiceVisit[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demo) {
      setVisits(demo.pendingVisits)
      setLoading(false)
      return
    }
    if (!vehicleId) {
      setVisits([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('service_visits')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('parse_status', ['pending', 'needs_review'])
      .order('created_at', { ascending: false })

    setVisits((data ?? []) as ServiceVisit[])
    setLoading(false)
  }, [vehicleId, demo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { visits, loading, refresh }
}

export function useVisitDetail(visitId: string | undefined) {
  const demo = useDemoData()
  const [visit, setVisit] = useState<ServiceVisit | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (demo) {
      const demoVisit = demo.visitById(visitId)
      setVisit(demoVisit)
      setLineItems(demo.lineItemsForVisit(visitId))
      setAttachments(demo.attachmentsForVisit(visitId))
      setError(demoVisit ? null : 'Visit not found')
      setLoading(false)
      return
    }
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
      supabase.from('attachments').select('*').eq('service_visit_id', visitId).order('uploaded_at'),
    ])

    if (visitRes.error) setError(visitRes.error.message)
    else setVisit(visitRes.data as ServiceVisit)

    setLineItems((itemsRes.data ?? []) as LineItem[])
    setAttachments((attachRes.data ?? []) as Attachment[])
    setLoading(false)
  }, [visitId, demo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { visit, lineItems, attachments, loading, error, refresh }
}

export async function getAttachmentSignedUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from('invoices').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

async function uploadFilesToVisit(
  visitId: string,
  householdId: string,
  files: File[],
): Promise<{ error: string | null }> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const path = `${householdId}/${visitId}/${Date.now()}-${i}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('invoices').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) return { error: uploadError.message }

    const { error: attachError } = await supabase.from('attachments').insert({
      service_visit_id: visitId,
      storage_path: path,
      mime_type: file.type,
    })
    if (attachError) return { error: attachError.message }
  }
  return { error: null }
}

export async function createPendingVisitWithFile(
  vehicleId: string,
  file: File,
  householdId: string,
): Promise<{ visitId: string | null; error: string | null }> {
  return createPendingVisitWithFiles(vehicleId, [file], householdId)
}

export async function createPendingVisitWithFiles(
  vehicleId: string,
  files: File[],
  householdId: string,
): Promise<{ visitId: string | null; error: string | null }> {
  if (!files.length) return { visitId: null, error: 'No files to upload' }

  const { data: visitRow, error: visitError } = await supabase
    .from('service_visits')
    .insert({
      vehicle_id: vehicleId,
      service_date: new Date().toISOString().slice(0, 10),
      parse_status: 'pending',
    })
    .select()
    .single()

  if (visitError || !visitRow) {
    return { visitId: null, error: visitError?.message ?? 'Failed to create visit' }
  }

  const visitId = visitRow.id as string
  const uploaded = await uploadFilesToVisit(visitId, householdId, files)
  if (uploaded.error) return { visitId, error: uploaded.error }

  return { visitId, error: null }
}

export async function addVisitAttachments(
  visitId: string,
  householdId: string,
  files: File[],
  resetParse = true,
): Promise<{ error: string | null }> {
  if (!files.length) return { error: null }

  const uploaded = await uploadFilesToVisit(visitId, householdId, files)
  if (uploaded.error) return uploaded

  if (resetParse) {
    await supabase
      .from('service_visits')
      .update({ parse_status: 'pending', raw_parse_json: null })
      .eq('id', visitId)
  }

  return { error: null }
}

export async function deleteVisitAttachment(
  attachmentId: string,
  storagePath: string,
): Promise<{ error: string | null }> {
  await supabase.storage.from('invoices').remove([storagePath])
  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId)
  return { error: error?.message ?? null }
}

export async function moveVisitToVehicle(
  visitId: string,
  vehicleId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('service_visits')
    .update({ vehicle_id: vehicleId })
    .eq('id', visitId)
  return { error: error?.message ?? null }
}

export async function replaceVisitAttachment(
  visitId: string,
  householdId: string,
  file: File,
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('attachments')
    .select('id, storage_path')
    .eq('service_visit_id', visitId)

  if (existing?.length) {
    const paths = existing.map((a) => a.storage_path)
    await supabase.storage.from('invoices').remove(paths)
    await supabase.from('attachments').delete().eq('service_visit_id', visitId)
  }

  const path = `${householdId}/${visitId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('invoices').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return { error: uploadError.message }

  const { error: attachError } = await supabase.from('attachments').insert({
    service_visit_id: visitId,
    storage_path: path,
    mime_type: file.type,
  })
  if (attachError) return { error: attachError.message }

  await supabase
    .from('service_visits')
    .update({ parse_status: 'pending', raw_parse_json: null })
    .eq('id', visitId)

  return { error: null }
}

async function markParseNeedsReview(visitId: string, parseError: string): Promise<void> {
  await supabase
    .from('service_visits')
    .update({
      parse_status: 'needs_review',
      raw_parse_json: { parse_error: parseError, line_items: [] },
    })
    .eq('id', visitId)
}

export async function discardPendingVisit(visitId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('service_visits').delete().eq('id', visitId)
  return { error: error?.message ?? null }
}

async function extractInvokeError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = (await ctx.json()) as { error?: string }
        if (body?.error) return body.error
      } catch {
        // ignore json parse failure
      }
    }
  }
  if (error instanceof Error) return error.message
  return 'Parse failed'
}

export async function invokeParseInvoice(
  visitId: string,
): Promise<{ ok: boolean; error: string | null; lineCount?: number }> {
  const timeoutMs = 45_000

  let data: Record<string, unknown> | null = null
  let invokeError: Error | null = null

  try {
    const result = await Promise.race([
      supabase.functions.invoke('parse-invoice', { body: { visit_id: visitId } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Parse timed out. The parser may not be deployed yet.')), timeoutMs),
      ),
    ])
    data = result.data as Record<string, unknown> | null
    if (result.error) invokeError = result.error
  } catch (err) {
    invokeError = err instanceof Error ? err : new Error('Parse failed')
  }

  if (invokeError) {
    const raw = await extractInvokeError(invokeError)
    let msg = raw
    if (
      raw.includes('FunctionsRelayError') ||
      raw.includes('Failed to send a request') ||
      raw.includes('timed out') ||
      raw.includes('non-2xx')
    ) {
      msg =
        raw.includes('non-2xx')
          ? 'Parser failed. Add GEMINI_API_KEY in Supabase → Edge Functions → Secrets, then run: npx supabase functions deploy parse-invoice'
          : 'Invoice parser is not set up yet. Deploy parse-invoice and add GEMINI_API_KEY in Supabase → Edge Functions → Secrets.'
    } else if (raw.includes('401') || raw.includes('403')) {
      msg = 'Not authorized to run the parser. Sign out and sign in again, then retry.'
    }
    await markParseNeedsReview(visitId, msg)
    return { ok: false, error: msg }
  }

  if (data?.error) {
    const msg = data.error as string
    await markParseNeedsReview(visitId, msg)
    return { ok: false, error: msg }
  }

  const parsed = data?.parsed as Record<string, unknown> | undefined
  const lineCount = Array.isArray(parsed?.line_items) ? (parsed.line_items as unknown[]).length : 0
  if (lineCount === 0 && parsed?.parse_error) {
    const msg = parsed.parse_error as string
    return { ok: false, error: msg, lineCount: 0 }
  }

  return { ok: true, error: null, lineCount }
}

export async function confirmVisit(
  visitId: string,
  visit: {
    service_date: string
    odometer: number | null
    shop_name: string | null
    invoice_number: string | null
    total_cents: number | null
    advisor_notes: string | null
  },
  lines: LineItemDraft[],
  userId: string,
): Promise<{ error: string | null }> {
  await supabase.from('line_items').delete().eq('service_visit_id', visitId)

  const validLines = lines.filter((l) => l.description.trim())
  if (validLines.length) {
    const { error: linesError } = await supabase.from('line_items').insert(
      validLines.map((line, index) => ({
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
    if (linesError) return { error: linesError.message }
  }

  const { error: updateError } = await supabase
    .from('service_visits')
    .update({
      ...visit,
      parse_status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by_user_id: userId,
    })
    .eq('id', visitId)

  return { error: updateError?.message ?? null }
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
  files: File[],
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

  if (files.length) {
    const uploaded = await uploadFilesToVisit(visitId, householdId, files)
    if (uploaded.error) return { visitId, error: uploaded.error }
  }

  return { visitId, error: null }
}

export async function searchVisits(
  vehicleId: string,
  query: string,
): Promise<{ visits: ServiceVisit[]; error: string | null }> {
  const q = query.trim().toLowerCase()
  const { data: allConfirmed, error: allError } = await supabase
    .from('service_visits')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('parse_status', 'confirmed')
    .order('service_date', { ascending: false })

  if (allError) return { visits: [], error: allError.message }
  const visits = (allConfirmed ?? []) as ServiceVisit[]
  if (!q) return { visits, error: null }

  const { data: items, error: itemsError } = await supabase
    .from('line_items')
    .select('service_visit_id, description')
    .ilike('description', `%${q}%`)

  if (itemsError) return { visits: [], error: itemsError.message }

  const lineMatchIds = new Set((items ?? []).map((i) => i.service_visit_id as string))

  const filtered = visits.filter((v) => {
    if (lineMatchIds.has(v.id)) return true
    if (v.shop_name?.toLowerCase().includes(q)) return true
    if (v.invoice_number?.toLowerCase().includes(q)) return true
    if (v.advisor_notes?.toLowerCase().includes(q)) return true
    if (v.service_date.includes(q)) return true
    return false
  })

  return { visits: filtered, error: null }
}
