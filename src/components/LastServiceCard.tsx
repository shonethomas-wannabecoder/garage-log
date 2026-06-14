import { Link } from 'react-router-dom'
import { ChevronRight, Flag, Wrench } from 'lucide-react'
import { formatDate, formatMileage, formatMoney } from '../lib/format'
import type { LineItem, ServiceCategory, ServiceVisit } from '../types'
import { CategoryChip } from './ui'

interface Props {
  visit: ServiceVisit | null
  lineItems: LineItem[]
  loading: boolean
}

function uniqueCategories(items: LineItem[]): ServiceCategory[] {
  const seen = new Set<ServiceCategory>()
  const out: ServiceCategory[] = []
  for (const item of items) {
    if (seen.has(item.category)) continue
    seen.add(item.category)
    out.push(item.category)
  }
  return out
}

export function LastServiceCard({ visit, lineItems, loading }: Props) {
  if (loading) {
    return (
      <section className="card p-4">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-3 w-40 animate-pulse rounded bg-surface-2" />
      </section>
    )
  }

  if (!visit) {
    return (
      <section className="card flex flex-col items-center border-dashed px-4 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-faint">
          <Wrench size={22} aria-hidden />
        </span>
        <h2 className="mt-3 text-base font-semibold">No service logged yet</h2>
        <p className="mt-1 text-sm text-muted">Log your first repair bill to start tracking.</p>
        <Link to="/visits/new" className="btn-primary mt-4 px-5 py-2.5 text-sm">
          Log a bill
        </Link>
      </section>
    )
  }

  const categories = uniqueCategories(lineItems)

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold">{formatDate(visit.service_date)}</p>
          <p className="mt-0.5 text-sm text-muted">{visit.shop_name ?? 'Unknown shop'}</p>
        </div>
        <p className="text-lg font-semibold">{formatMoney(visit.total_cents, visit.currency)}</p>
      </div>

      <p className="mt-1 text-sm text-faint">{formatMileage(visit.odometer)}</p>

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <CategoryChip key={c} category={c} />
          ))}
        </div>
      )}

      {visit.advisor_notes && (
        <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-sm text-on-warn-soft">
          <Flag size={15} className="mt-0.5 shrink-0" aria-hidden />
          <span className="leading-relaxed">{visit.advisor_notes}</span>
        </div>
      )}

      <Link
        to={`/visits/${visit.id}`}
        className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-line py-2 text-sm font-medium text-brand active:bg-surface-2"
      >
        View full details
        <ChevronRight size={15} aria-hidden />
      </Link>
    </section>
  )
}
