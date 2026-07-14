import type { OemSchedule } from './types'
import { everyNMiles, makeIncludes } from './types'

/** Approximate Honda factory-style mileage checkpoints (USA passenger, ~2016–2022). */
export const hondaUsaSchedule: OemSchedule = {
  id: 'honda-usa-2016-2022',
  label: 'Honda factory-style schedule (USA)',
  source: {
    title: 'Honda USA maintenance schedule (approximate intervals)',
    url: 'https://www.honda.com/',
  },
  matches: (v) => {
    if (!v.year || v.year < 2016 || v.year > 2022) return false
    return makeIncludes(v.make, ['honda', 'acura'])
  },
  milestonesThrough: (max) => everyNMiles(10_000, 10_000, max),
  milestoneAt: (miles) => {
    const items: string[] = []
    const titles: string[] = ['Engine oil and filter']
    if (miles % 30_000 === 0) {
      items.push('Cabin air filter')
      items.push('Engine air filter')
      titles.push('Filter service')
    }
    if (miles % 60_000 === 0) {
      items.push('Transmission fluid inspection/service')
      items.push('Spark plugs (where applicable)')
      titles.push('Major service')
    }
    if (miles % 100_000 === 0) {
      items.push('Coolant replacement (if due)')
    }
    return {
      miles,
      title: `${miles.toLocaleString()} mi — ${titles[0]}${titles.length > 1 ? ` + ${titles.slice(1).join(' + ')}` : ''}`,
      additionalItems: items,
      summaries: titles,
    }
  },
}
