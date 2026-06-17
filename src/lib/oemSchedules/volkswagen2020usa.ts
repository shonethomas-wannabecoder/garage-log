/**
 * Volkswagen Group of America — MY 2020 factory maintenance schedule (USA).
 * Applies to 2020 model-year VW passenger vehicles except e-Golf (includes Passat).
 * @see https://static.nhtsa.gov/odi/tsbs/2019/MC-10162898-0001.pdf
 */

export const VW_2020_USA_SOURCE = {
  title: 'Volkswagen Group of America, 2020 factory maintenance schedule (USA)',
  url: 'https://static.nhtsa.gov/odi/tsbs/2019/MC-10162898-0001.pdf',
} as const

export type VwServiceType = 'minor' | 'standard' | 'extended'

export interface VwMilestone {
  miles: number
  serviceTypes: VwServiceType[]
  additionalItems: string[]
}

const MINOR_SUMMARY =
  'Oil and filter change, brake pad/disc check, service interval reset.'
const STANDARD_SUMMARY =
  'Minor items plus battery test, brake fluid level, cooling system, leak inspections, lights, tires, wipers, and test drive.'
const EXTENDED_SUMMARY =
  'Standard items plus corrosion check, exhaust, suspension/steering play, ribbed belt, underbody, and sunroof rail lubrication (if equipped).'

export const VW_SERVICE_TYPE_SUMMARY: Record<VwServiceType, string> = {
  minor: MINOR_SUMMARY,
  standard: STANDARD_SUMMARY,
  extended: EXTENDED_SUMMARY,
}

export function vwServiceTypeLabel(type: VwServiceType): string {
  switch (type) {
    case 'minor':
      return 'Minor maintenance'
    case 'standard':
      return 'Standard maintenance'
    case 'extended':
      return 'Extended maintenance'
  }
}

/** Factory mileage checkpoints through 200k mi. */
export function vwMilestonesThrough(maxMiles: number): number[] {
  const miles: number[] = []
  for (let m = 10_000; m <= maxMiles; m += 10_000) {
    miles.push(m)
  }
  return miles
}

/** Minor at 10k, then every 20k (30k, 50k, …). Standard at 20k and every 20k. Extended every 40k from 40k. */
export function vwServiceTypesAt(miles: number): VwServiceType[] {
  const types: VwServiceType[] = []
  const isMinor = miles === 10_000 || (miles > 10_000 && (miles - 10_000) % 20_000 === 0)
  const isStandard = miles % 20_000 === 0
  const isExtended = miles % 40_000 === 0

  if (isMinor) types.push('minor')
  if (isStandard) types.push('standard')
  if (isExtended) types.push('extended')

  return types
}

/** Additional factory items tied to mileage (Passat uses 40k spark plug interval, not 80k SUV interval). */
export function vwAdditionalItemsAt(miles: number): string[] {
  const items: string[] = []

  if (miles % 40_000 === 0) {
    items.push('Dust and pollen filter replacement')
    items.push('Spark plug replacement')
  }
  if (miles % 60_000 === 0) {
    items.push('Air filter element replacement')
  }
  if (miles % 80_000 === 0) {
    items.push('Automatic transmission fluid and filter change')
  }
  if (miles % 20_000 === 0) {
    items.push('Sunroof drain check (if equipped)')
  }

  return items
}

export function vwMilestoneAt(miles: number): VwMilestone {
  return {
    miles,
    serviceTypes: vwServiceTypesAt(miles),
    additionalItems: vwAdditionalItemsAt(miles),
  }
}

/** Matches VW passenger vehicles that use the published 2020 USA factory schedule. */
export function matchesVolkswagen2020UsaSchedule(make: string | null, year: number | null): boolean {
  if (!year || year < 2019 || year > 2021) return false
  const m = (make ?? '').toLowerCase().trim()
  return m.includes('volkswagen') || m === 'vw' || m.startsWith('vw ')
}
