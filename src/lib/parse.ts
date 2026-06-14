import type { LineItemDraft, ParsedInvoiceJson, ServiceCategory } from '../types'

const VALID_CATEGORIES = new Set([
  'oil_fluid', 'brakes', 'tires', 'battery', 'filters', 'suspension',
  'engine', 'transmission', 'electrical', 'inspection', 'other',
])

const VALID_TYPES = new Set(['part', 'labor', 'fee', 'tax', 'other'])

export function lineItemsFromParse(raw: ParsedInvoiceJson | null | undefined): LineItemDraft[] {
  if (!raw?.line_items?.length) {
    return [{ description: '', category: 'other', item_type: 'part', quantity: 1, unit_price_cents: null, line_total_cents: null }]
  }

  return raw.line_items.map((item) => ({
    description: item.description?.trim() ?? '',
    category: (VALID_CATEGORIES.has(item.category ?? '') ? item.category : 'other') as ServiceCategory,
    item_type: (VALID_TYPES.has(item.item_type ?? '') ? item.item_type : 'other') as LineItemDraft['item_type'],
    quantity: item.quantity ?? 1,
    unit_price_cents: null,
    line_total_cents: item.line_total_cents ?? null,
  }))
}
