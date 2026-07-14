import type { CategoryHistory } from '../hooks/useVisits'
import type { ServiceCategory } from '../types'

export interface ReminderItem {
  id: string
  category: ServiceCategory
  label: string
  milesRemaining: number | null
  monthsRemaining: number | null
  status: 'upcoming' | 'due_now' | 'overdue'
  detail: string
}

const INTERVALS: Partial<
  Record<ServiceCategory, { label: string; miles: number; months: number }>
> = {
  oil_fluid: { label: 'Oil & fluids', miles: 5_000, months: 6 },
  filters: { label: 'Filters', miles: 15_000, months: 12 },
  brakes: { label: 'Brakes', miles: 30_000, months: 24 },
  tires: { label: 'Tires / rotation', miles: 7_500, months: 6 },
  battery: { label: 'Battery', miles: 40_000, months: 36 },
}

function monthsBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso + (fromIso.includes('T') ? '' : 'T12:00:00'))
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export function buildReminders(
  history: Record<string, CategoryHistory>,
  currentMiles: number | null,
): ReminderItem[] {
  const items: ReminderItem[] = []

  for (const [category, interval] of Object.entries(INTERVALS) as Array<
    [ServiceCategory, { label: string; miles: number; months: number }]
  >) {
    const last = history[category]
    if (!last) continue

    const monthsSince = monthsBetween(last.serviceDate)
    const monthsRemaining = interval.months - monthsSince

    let milesRemaining: number | null = null
    if (currentMiles != null && last.odometer != null) {
      milesRemaining = interval.miles - (currentMiles - last.odometer)
    }

    let status: ReminderItem['status'] = 'upcoming'
    const dueByMiles = milesRemaining != null && milesRemaining <= 500
    const dueByMonths = monthsRemaining <= 1
    const overdueByMiles = milesRemaining != null && milesRemaining < 0
    const overdueByMonths = monthsRemaining < 0

    if (overdueByMiles || overdueByMonths) status = 'overdue'
    else if (dueByMiles || dueByMonths) status = 'due_now'

    const parts: string[] = []
    if (milesRemaining != null) {
      parts.push(
        milesRemaining >= 0
          ? `${milesRemaining.toLocaleString()} mi left`
          : `${Math.abs(milesRemaining).toLocaleString()} mi overdue`,
      )
    }
    parts.push(
      monthsRemaining >= 0
        ? `~${monthsRemaining} mo left`
        : `${Math.abs(monthsRemaining)} mo overdue`,
    )

    items.push({
      id: category,
      category,
      label: interval.label,
      milesRemaining,
      monthsRemaining,
      status,
      detail: `Last ${last.serviceDate.slice(0, 10)} · ${parts.join(' · ')}`,
    })
  }

  const order = { overdue: 0, due_now: 1, upcoming: 2 }
  return items.sort((a, b) => order[a.status] - order[b.status])
}
