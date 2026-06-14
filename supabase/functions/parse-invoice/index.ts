import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CATEGORIES = [
  'oil_fluid', 'brakes', 'tires', 'battery', 'filters', 'suspension',
  'engine', 'transmission', 'electrical', 'inspection', 'other',
] as const

const ITEM_TYPES = ['part', 'labor', 'fee', 'tax', 'other'] as const

interface ParsedLineItem {
  description: string
  category: string
  item_type: string
  quantity: number
  line_total_cents: number | null
}

interface ParsedInvoice {
  service_date: string | null
  odometer: number | null
  shop_name: string | null
  invoice_number: string | null
  total_cents: number | null
  line_items: ParsedLineItem[]
  parse_error?: string
}

/** Always 200 so the app gets a readable JSON error (not "non-2xx status code"). */
function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeCategory(value: string): string {
  const v = value.toLowerCase().replace(/\s+/g, '_')
  return (CATEGORIES as readonly string[]).includes(v) ? v : 'other'
}

function normalizeItemType(value: string): string {
  const v = value.toLowerCase()
  return (ITEM_TYPES as readonly string[]).includes(v) ? v : 'other'
}

function sanitizeParsed(data: Record<string, unknown>): ParsedInvoice {
  const rawItems = Array.isArray(data.line_items) ? data.line_items : []
  const line_items: ParsedLineItem[] = rawItems
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      description: String(item.description ?? '').trim(),
      category: normalizeCategory(String(item.category ?? 'other')),
      item_type: normalizeItemType(String(item.item_type ?? 'other')),
      quantity: Number(item.quantity) || 1,
      line_total_cents:
        item.line_total_cents != null ? Math.round(Number(item.line_total_cents)) : null,
    }))
    .filter((item) => item.description.length > 0)

  return {
    service_date: typeof data.service_date === 'string' ? data.service_date : null,
    odometer: data.odometer != null ? Math.round(Number(data.odometer)) : null,
    shop_name: typeof data.shop_name === 'string' ? data.shop_name.trim() || null : null,
    invoice_number:
      typeof data.invoice_number === 'string' ? data.invoice_number.trim() || null : null,
    total_cents: data.total_cents != null ? Math.round(Number(data.total_cents)) : null,
    line_items,
  }
}

function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)))
  }
  return btoa(parts.join(''))
}

const EXTRACT_PROMPT = `Extract data from this auto repair invoice. Return ONLY valid JSON (no markdown fences) with this shape:
{
  "service_date": "YYYY-MM-DD or null",
  "odometer": number or null,
  "shop_name": string or null,
  "invoice_number": string or null,
  "total_cents": integer cents or null,
  "line_items": [
    {
      "description": string,
      "category": one of ${CATEGORIES.join('|')},
      "item_type": one of ${ITEM_TYPES.join('|')},
      "quantity": number,
      "line_total_cents": integer cents or null
    }
  ]
}
Use category "other" when unsure. Convert dollar amounts to cents.`

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(raw) as Record<string, unknown>
}

async function callClaude(base64: string, mimeType: string): Promise<ParsedInvoice> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not set. Add it in Supabase → Edge Functions → Secrets, then redeploy parse-invoice.',
    )
  }

  const isPdf = mimeType === 'application/pdf'
  const mediaType = isPdf ? 'application/pdf' : mimeType

  const content: Array<Record<string, unknown>> = isPdf
    ? [
        {
          type: 'document',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        { type: 'text', text: EXTRACT_PROMPT },
      ]
    : [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        { type: 'text', text: EXTRACT_PROMPT },
      ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err.slice(0, 300)}`)
  }

  const payload = await res.json()
  const textBlock = payload.content?.find((b: { type: string }) => b.type === 'text')
  const text = textBlock?.text
  if (!text) throw new Error('Empty response from Claude')

  return sanitizeParsed(extractJson(text))
}

function emptyParsed(parseError: string): ParsedInvoice {
  return {
    service_date: null,
    odometer: null,
    shop_name: null,
    invoice_number: null,
    total_cents: null,
    line_items: [],
    parse_error: parseError,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return ok({ error: 'Missing authorization. Sign out and sign in again.' })

    const { visit_id } = await req.json()
    if (!visit_id) return ok({ error: 'visit_id required' })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return ok({ error: 'Supabase env vars missing on edge function.' })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: visit, error: visitError } = await userClient
      .from('service_visits')
      .select('id, vehicle_id, parse_status')
      .eq('id', visit_id)
      .single()

    if (visitError || !visit) return ok({ error: 'Visit not found or access denied' })

    const { data: attachments } = await userClient
      .from('attachments')
      .select('storage_path, mime_type')
      .eq('service_visit_id', visit_id)
      .limit(1)

    const attachment = attachments?.[0]
    if (!attachment) return ok({ error: 'No invoice file attached' })

    const { data: fileData, error: downloadError } = await admin.storage
      .from('invoices')
      .download(attachment.storage_path)

    if (downloadError || !fileData) {
      return ok({ error: `Failed to download invoice: ${downloadError?.message ?? 'unknown'}` })
    }

    const mimeType = attachment.mime_type || 'image/jpeg'
    if (
      mimeType === 'image/heic' ||
      mimeType === 'image/heif' ||
      attachment.storage_path.toLowerCase().endsWith('.heic')
    ) {
      const parsed = emptyParsed(
        'HEIC photo not supported on server. Re-upload from Log (we convert on phone) or use Enter manually.',
      )
      await admin.from('service_visits').update({
        raw_parse_json: parsed,
        parse_status: 'needs_review',
      }).eq('id', visit_id)
      return ok({ ok: true, parsed })
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer())
    const base64 = toBase64(bytes)

    let parsed: ParsedInvoice
    try {
      parsed = await callClaude(base64, mimeType)
    } catch (parseErr) {
      parsed = emptyParsed(parseErr instanceof Error ? parseErr.message : 'Parse failed')
    }

    const serviceDate =
      parsed.service_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.service_date)
        ? parsed.service_date
        : new Date().toISOString().slice(0, 10)

    const { error: updateError } = await admin
      .from('service_visits')
      .update({
        service_date: serviceDate,
        odometer: parsed.odometer,
        shop_name: parsed.shop_name,
        invoice_number: parsed.invoice_number,
        total_cents: parsed.total_cents,
        raw_parse_json: parsed,
        parse_status: 'needs_review',
      })
      .eq('id', visit_id)

    if (updateError) return ok({ error: updateError.message })

    return ok({ ok: true, parsed })
  } catch (err) {
    return ok({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
})
