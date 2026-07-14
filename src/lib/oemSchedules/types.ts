import type { Vehicle } from '../../types'

export interface OemSource {
  title: string
  url: string
}

export interface OemMilestone {
  miles: number
  title: string
  additionalItems: string[]
  summaries: string[]
}

export interface OemSchedule {
  id: string
  label: string
  source: OemSource
  matches: (vehicle: Vehicle) => boolean
  milestonesThrough: (maxMiles: number) => number[]
  milestoneAt: (miles: number) => OemMilestone
}

export function everyNMiles(start: number, step: number, max: number): number[] {
  const out: number[] = []
  for (let m = start; m <= max; m += step) out.push(m)
  return out
}

export function makeIncludes(make: string | null, needles: string[]): boolean {
  const m = (make ?? '').toLowerCase().trim()
  return needles.some((n) => m === n || m.includes(n))
}
