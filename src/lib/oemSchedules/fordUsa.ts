import type { OemSchedule } from './types'
import { everyNMiles, makeIncludes } from './types'

/** Approximate Ford factory-style mileage checkpoints (USA light trucks/cars, ~2015–2022). */
export const fordUsaSchedule: OemSchedule = {
  id: 'ford-usa-2015-2022',
  label: 'Ford factory-style schedule (USA)',
  source: {
    title: 'Ford USA maintenance schedule (approximate intervals)',
    url: 'https://www.ford.com/',
  },
  matches: (v) => {
    if (!v.year || v.year < 2015 || v.year > 2022) return false
    return makeIncludes(v.make, ['ford', 'lincoln'])
  },
  milestonesThrough: (max) => everyNMiles(10_000, 10_000, max),
  milestoneAt: (miles) => {
    const items: string[] = []
    const titles: string[] = ['Engine oil and filter']
    if (miles % 20_000 === 0) {
      items.push('Cabin air filter')
      items.push('Tire rotation check')
    }
    if (miles % 30_000 === 0) {
      items.push('Engine air filter')
      items.push('Brake system inspection')
      titles.push('Inspection service')
    }
    if (miles % 60_000 === 0) {
      items.push('Transmission fluid (where applicable)')
      items.push('Spark plugs (where applicable)')
      titles.push('Major service')
    }
    if (miles % 100_000 === 0) {
      items.push('Coolant flush')
    }
    return {
      miles,
      title: `${miles.toLocaleString()} mi — ${titles.join(' + ')}`,
      additionalItems: items,
      summaries: titles,
    }
  },
}
