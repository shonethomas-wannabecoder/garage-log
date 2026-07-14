import type { OemSchedule } from './types'
import { everyNMiles, makeIncludes } from './types'

/** Approximate Toyota factory-style mileage checkpoints (USA passenger, ~2016–2022). */
export const toyotaUsaSchedule: OemSchedule = {
  id: 'toyota-usa-2016-2022',
  label: 'Toyota factory-style schedule (USA)',
  source: {
    title: 'Toyota USA maintenance schedule (approximate intervals)',
    url: 'https://www.toyota.com/',
  },
  matches: (v) => {
    if (!v.year || v.year < 2016 || v.year > 2022) return false
    return makeIncludes(v.make, ['toyota', 'lexus'])
  },
  milestonesThrough: (max) => everyNMiles(10_000, 10_000, max),
  milestoneAt: (miles) => {
    const items: string[] = []
    const titles: string[] = ['Engine oil and filter']
    if (miles % 20_000 === 0) {
      items.push('Cabin air filter')
      titles.push('Cabin filter')
    }
    if (miles % 30_000 === 0) {
      items.push('Engine air filter')
      items.push('Brake fluid inspection')
    }
    if (miles % 60_000 === 0) {
      items.push('Spark plugs (where applicable)')
      items.push('Differential / transfer case fluid (if equipped)')
      titles.push('Major service')
    }
    if (miles % 100_000 === 0) {
      items.push('Coolant and accessory drive belt')
    }
    return {
      miles,
      title: `${miles.toLocaleString()} mi — ${titles.join(' + ')}`,
      additionalItems: items,
      summaries: titles,
    }
  },
}
