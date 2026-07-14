import { findOemSchedule } from './oemSchedules'
import type { OemSource } from './oemSchedules/types'
import type { Vehicle } from '../types'

export interface NextFactoryService {
  milestoneMiles: number
  title: string
  serviceTypeLabels: string[]
  additionalItems: string[]
  summaries: string[]
  milesUntil: number | null
  currentMiles: number | null
  status: 'upcoming' | 'due_now' | 'overdue'
  scheduleLabel: string
  source: OemSource
}

const DUE_NOW_BUFFER_MILES = 2_500
const OVERDUE_PAST_MILES = 1_500

function findMilestone(
  currentMiles: number,
  milestones: number[],
): {
  miles: number
  status: NextFactoryService['status']
  milesUntil: number
} {
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

  const next = (milestones[milestones.length - 1] ?? 10_000) + 10_000
  return { miles: next, status: 'upcoming', milesUntil: next - currentMiles }
}

export function computeNextFactoryService(
  vehicle: Vehicle,
  currentMiles: number | null,
): NextFactoryService | null {
  const schedule = findOemSchedule(vehicle)
  if (!schedule) return null

  const ymm = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const scheduleLabel = ymm ? `${ymm} · ${schedule.label}` : schedule.label

  if (currentMiles == null) {
    const first = schedule.milestoneAt(10_000)
    return {
      milestoneMiles: 10_000,
      title: first.title,
      serviceTypeLabels: first.summaries,
      additionalItems: first.additionalItems,
      summaries: first.summaries,
      milesUntil: null,
      currentMiles: null,
      status: 'upcoming',
      scheduleLabel,
      source: schedule.source,
    }
  }

  const milestones = schedule.milestonesThrough(200_000)
  const { miles, status, milesUntil } = findMilestone(currentMiles, milestones)
  const milestone = schedule.milestoneAt(miles)

  return {
    milestoneMiles: miles,
    title: milestone.title,
    serviceTypeLabels: milestone.summaries,
    additionalItems: milestone.additionalItems,
    summaries: milestone.summaries,
    milesUntil,
    currentMiles,
    status,
    scheduleLabel,
    source: schedule.source,
  }
}
