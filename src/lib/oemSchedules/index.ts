import type { Vehicle } from '../../types'
import {
  VW_2020_USA_SOURCE,
  matchesVolkswagen2020UsaSchedule,
  vwAdditionalItemsAt,
  vwMilestoneAt,
  vwMilestonesThrough,
  vwServiceTypeLabel,
} from './volkswagen2020usa'
import { hondaUsaSchedule } from './hondaUsa'
import { toyotaUsaSchedule } from './toyotaUsa'
import { fordUsaSchedule } from './fordUsa'
import type { OemSchedule } from './types'
import { everyNMiles } from './types'

const vwAsOemSchedule: OemSchedule = {
  id: 'vw-usa-2019-2021',
  label: 'Volkswagen factory schedule (USA)',
  source: VW_2020_USA_SOURCE,
  matches: (v) => matchesVolkswagen2020UsaSchedule(v.make, v.year),
  milestonesThrough: vwMilestonesThrough,
  milestoneAt: (miles) => {
    const m = vwMilestoneAt(miles)
    return {
      miles,
      title:
        m.serviceTypes.length === 1
          ? `${miles.toLocaleString()} mi — ${vwServiceTypeLabel(m.serviceTypes[0])}`
          : `${miles.toLocaleString()} mi — ${m.serviceTypes.map(vwServiceTypeLabel).join(' + ')}`,
      additionalItems: vwAdditionalItemsAt(miles),
      summaries: m.serviceTypes.map(vwServiceTypeLabel),
    }
  },
}

/** Ordered registry — first match wins. */
export const OEM_SCHEDULES: OemSchedule[] = [
  vwAsOemSchedule,
  hondaUsaSchedule,
  toyotaUsaSchedule,
  fordUsaSchedule,
]

export function findOemSchedule(vehicle: Vehicle): OemSchedule | null {
  return OEM_SCHEDULES.find((s) => s.matches(vehicle)) ?? null
}

export { everyNMiles }
