import {
  VW_2020_USA_SOURCE,
  vwMilestoneAt,
  vwMilestonesThrough,
  vwServiceTypeLabel,
  type VwServiceType,
  matchesVolkswagen2020UsaSchedule,
} from './oemSchedules/volkswagen2020usa'
import type { Vehicle } from '../types'

export interface NextFactoryService {
  milestoneMiles: number
  title: string
  serviceTypes: VwServiceType[]
  serviceTypeLabels: string[]
  additionalItems: string[]
  summaries: string[]
  milesUntil: number | null
  currentMiles: number | null
  status: 'upcoming' | 'due_now' | 'overdue'
  scheduleLabel: string
  source: typeof VW_2020_USA_SOURCE
}

const DUE_NOW_BUFFER_MILES = 2_500
const OVERDUE_PAST_MILES = 1_500

function formatMiles(miles: number): string {
  return `${miles.toLocaleString()} mi`
}

function milestoneTitle(miles: number, types: VwServiceType[]): string {
  const labels = types.map(vwServiceTypeLabel)
  if (labels.length === 1) {
    return `${formatMiles(miles)} — ${labels[0]}`
  }
  return `${formatMiles(miles)} — ${labels.join(' + ')}`
}

function findMilestone(currentMiles: number): {
  miles: number
  status: NextFactoryService['status']
  milesUntil: number
} {
  const milestones = vwMilestonesThrough(200_000)
  const upcoming = milestones.find((m) => m >= currentMiles)
  const passed = [...milestones].reverse().find((m) => m < currentMiles)

  if (upcoming && passed) {
    const toUpcoming = upcoming - currentMiles
    const fromPassed = currentMiles - passed

    if (fromPassed <= OVERDUE_PAST_MILES && fromPassed < toUpcoming) {
      return { miles: passed, status: 'overdue', milesUntil: passed - currentMiles }
    }
    if (toUpcoming <= DUE_NOW_BUFFER_MILES) {
      return { miles: upcoming, status: 'due_now', milesUntil: toUpcoming }
    }
    return { miles: upcoming, status: 'upcoming', milesUntil: toUpcoming }
  }

  if (upcoming) {
    const toUpcoming = upcoming - currentMiles
    return {
      miles: upcoming,
      status: toUpcoming <= DUE_NOW_BUFFER_MILES ? 'due_now' : 'upcoming',
      milesUntil: toUpcoming,
    }
  }

  const next = milestones[milestones.length - 1] + 10_000
  return { miles: next, status: 'upcoming', milesUntil: next - currentMiles }
}

export function computeNextFactoryService(
  vehicle: Vehicle,
  currentMiles: number | null,
): NextFactoryService | null {
  if (!matchesVolkswagen2020UsaSchedule(vehicle.make, vehicle.year)) {
    return null
  }

  const ymm = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const scheduleLabel = ymm
    ? `${ymm} · VW factory schedule (USA)`
    : 'Volkswagen · factory schedule (USA)'

  if (currentMiles == null) {
    const first = vwMilestoneAt(10_000)
    return {
      milestoneMiles: 10_000,
      title: milestoneTitle(10_000, first.serviceTypes),
      serviceTypes: first.serviceTypes,
      serviceTypeLabels: first.serviceTypes.map(vwServiceTypeLabel),
      additionalItems: first.additionalItems,
      summaries: first.serviceTypes.map((t) => vwServiceTypeLabel(t)),
      milesUntil: null,
      currentMiles: null,
      status: 'upcoming',
      scheduleLabel,
      source: VW_2020_USA_SOURCE,
    }
  }

  const { miles, status, milesUntil } = findMilestone(currentMiles)
  const milestone = vwMilestoneAt(miles)

  return {
    milestoneMiles: miles,
    title: milestoneTitle(miles, milestone.serviceTypes),
    serviceTypes: milestone.serviceTypes,
    serviceTypeLabels: milestone.serviceTypes.map(vwServiceTypeLabel),
    additionalItems: milestone.additionalItems,
    summaries: milestone.serviceTypes.map((t) => vwServiceTypeLabel(t)),
    milesUntil,
    currentMiles,
    status,
    scheduleLabel,
    source: VW_2020_USA_SOURCE,
  }
}
