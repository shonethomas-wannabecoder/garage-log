import type {
  Attachment,
  Household,
  HouseholdInvite,
  HouseholdMember,
  LineItem,
  ServiceCategory,
  ServiceVisit,
  Vehicle,
} from '../types'

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001'
export const DEMO_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000002'
export const DEMO_VEHICLE_ID = '00000000-0000-4000-8000-000000000003'
export const DEMO_VEHICLE_ID_2 = '00000000-0000-4000-8000-000000000006'
export const DEMO_VISIT_REVIEW_ID = '00000000-0000-4000-8000-000000000004'
export const DEMO_VISIT_CONFIRMED_ID = '00000000-0000-4000-8000-000000000005'

export const demoHousehold: Household = {
  id: DEMO_HOUSEHOLD_ID,
  name: 'My Garage',
  created_at: '2026-01-01T00:00:00Z',
}

export const demoVehicle: Vehicle = {
  id: DEMO_VEHICLE_ID,
  household_id: DEMO_HOUSEHOLD_ID,
  nickname: 'Passat',
  year: 2020,
  make: 'Volkswagen',
  model: 'Passat',
  vin: '1VWSA7A30LC012345',
  shop_concerns: null,
  current_odometer: 96000,
  odometer_updated_at: '2026-07-14T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
}

export const demoVehicle2: Vehicle = {
  id: DEMO_VEHICLE_ID_2,
  household_id: DEMO_HOUSEHOLD_ID,
  nickname: 'CR-V',
  year: 2018,
  make: 'Honda',
  model: 'CR-V',
  vin: '5J6RW2H89JL012345',
  shop_concerns: null,
  current_odometer: 62000,
  odometer_updated_at: '2026-02-01T00:00:00Z',
  created_at: '2026-02-01T00:00:00Z',
}

/** Prefill for journey screenshot on the Cars page. */
export const demoAddVehicleDraft = {
  nickname: 'Weekend truck',
  year: '2016',
  make: 'Ford',
  model: 'F-150',
  vin: '1FTFW1E84GFA12345',
}

/** Prefill for journey screenshot on Search. */
export const demoSearchQuery = 'Onion Creek'

/** Prefill for journey screenshot on Family. */
export const demoInviteDraft = {
  email: 'alex@family.com',
}

export const demoPendingInvites: HouseholdInvite[] = [
  {
    id: '00000000-0000-4000-8000-000000000030',
    household_id: DEMO_HOUSEHOLD_ID,
    email: 'alex@family.com',
    invited_by: DEMO_USER_ID,
    status: 'pending',
    created_at: '2026-07-01T00:00:00Z',
    accepted_at: null,
  },
]

export const demoMembers: HouseholdMember[] = [
  {
    household_id: DEMO_HOUSEHOLD_ID,
    user_id: DEMO_USER_ID,
    role: 'owner',
    created_at: '2026-01-01T00:00:00Z',
  },
]

export const demoReviewVisit: ServiceVisit = {
  id: DEMO_VISIT_REVIEW_ID,
  vehicle_id: DEMO_VEHICLE_ID,
  service_date: '2026-03-20',
  odometer: 91966,
  shop_name: 'Onion Creek Volkswagen',
  invoice_number: '6164744',
  total_cents: 40663,
  currency: 'USD',
  advisor_notes: null,
  parse_status: 'needs_review',
  raw_parse_json: {
    service_date: '2026-03-20',
    odometer: 91966,
    shop_name: 'Onion Creek Volkswagen',
    invoice_number: '6164744',
    total_cents: 40663,
    advisor_notes: null,
    line_items: [
      {
        description: 'ENGINE OIL SERVICE',
        category: 'oil_fluid',
        item_type: 'labor',
        line_total_cents: 6673,
      },
      {
        description: 'ENG.OIL',
        category: 'oil_fluid',
        item_type: 'part',
        line_total_cents: 5673,
      },
    ],
  },
  confirmed_at: null,
  created_at: '2026-03-20T12:00:00Z',
}

export const demoConfirmedVisit: ServiceVisit = {
  id: DEMO_VISIT_CONFIRMED_ID,
  vehicle_id: DEMO_VEHICLE_ID,
  service_date: '2026-03-20',
  odometer: 91966,
  shop_name: 'Onion Creek Volkswagen',
  invoice_number: '6164744',
  total_cents: 40663,
  currency: 'USD',
  advisor_notes: 'Recommend cabin filter at next visit.',
  parse_status: 'confirmed',
  confirmed_at: '2026-03-20T14:00:00Z',
  created_at: '2026-03-20T12:00:00Z',
}

export const demoReviewLineItems: LineItem[] = [
  {
    id: '00000000-0000-4000-8000-0000000011',
    service_visit_id: DEMO_VISIT_REVIEW_ID,
    description: 'ENGINE OIL SERVICE',
    category: 'oil_fluid',
    item_type: 'labor',
    quantity: 1,
    unit_price_cents: 6673,
    line_total_cents: 6673,
    sort_order: 0,
  },
  {
    id: '00000000-0000-4000-8000-0000000012',
    service_visit_id: DEMO_VISIT_REVIEW_ID,
    description: 'ENG.OIL',
    category: 'oil_fluid',
    item_type: 'part',
    quantity: 1,
    unit_price_cents: 5673,
    line_total_cents: 5673,
    sort_order: 1,
  },
  {
    id: '00000000-0000-4000-8000-0000000013',
    service_visit_id: DEMO_VISIT_REVIEW_ID,
    description: 'DRAIN PLUG',
    category: 'oil_fluid',
    item_type: 'part',
    quantity: 1,
    unit_price_cents: 8022,
    line_total_cents: 8022,
    sort_order: 2,
  },
]

export const demoConfirmedLineItems: LineItem[] = demoReviewLineItems.map((item) => ({
  ...item,
  id: item.id.replace('11', '21').replace('12', '22').replace('13', '23'),
  service_visit_id: DEMO_VISIT_CONFIRMED_ID,
}))

export const demoAttachments: Attachment[] = []

export const demoLogPageNames = ['invoice-page-1.jpg']

export const demoCompareSeed = [
  { id: 'demo-1', category: 'oil_fluid' as ServiceCategory, description: 'Brake fluid flush' },
  { id: 'demo-2', category: 'filters' as ServiceCategory, description: 'Cabin filter' },
]
