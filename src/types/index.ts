export type MemberRole = 'owner' | 'member'
export type ParseStatus = 'pending' | 'needs_review' | 'confirmed'
export type LineItemType = 'part' | 'labor' | 'fee' | 'tax' | 'other'
export type ServiceCategory =
  | 'oil_fluid'
  | 'brakes'
  | 'tires'
  | 'battery'
  | 'filters'
  | 'suspension'
  | 'engine'
  | 'transmission'
  | 'electrical'
  | 'inspection'
  | 'other'

export interface Household {
  id: string
  name: string
  created_at: string
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: MemberRole
  created_at: string
}

export interface Vehicle {
  id: string
  household_id: string
  nickname: string
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  created_at: string
}

export interface ServiceVisit {
  id: string
  vehicle_id: string
  service_date: string
  odometer: number | null
  shop_name: string | null
  invoice_number: string | null
  total_cents: number | null
  currency: string
  advisor_notes: string | null
  parse_status: ParseStatus
  confirmed_at: string | null
  created_at: string
}

export interface LineItem {
  id: string
  service_visit_id: string
  description: string
  category: ServiceCategory
  item_type: LineItemType
  quantity: number
  unit_price_cents: number | null
  line_total_cents: number | null
  sort_order: number
}

export interface Attachment {
  id: string
  service_visit_id: string
  storage_path: string
  mime_type: string | null
  uploaded_at: string
}

export interface LineItemDraft {
  description: string
  category: ServiceCategory
  item_type: LineItemType
  quantity: number
  unit_price_cents: number | null
  line_total_cents: number | null
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  oil_fluid: 'Oil & fluids',
  brakes: 'Brakes',
  tires: 'Tires',
  battery: 'Battery',
  filters: 'Filters',
  suspension: 'Suspension',
  engine: 'Engine',
  transmission: 'Transmission',
  electrical: 'Electrical',
  inspection: 'Inspection',
  other: 'Other',
}
