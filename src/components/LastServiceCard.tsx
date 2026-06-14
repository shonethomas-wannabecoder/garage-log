import { Link } from 'react-router-dom'
import { formatDate, formatMileage, formatMoney } from '../lib/format'
import type { LineItem, ServiceVisit } from '../types'
import { CATEGORY_LABELS } from '../types'

interface Props {
  visit: ServiceVisit | null
  lineItems: LineItem[]
  loading: boolean
}

function summarizeCategories(items: LineItem[]): string[] {
  const seen = new Set<string>()
  const bullets: string[] = []
  for (const item of items) {
    const label = CATEGORY_LABELS[item.category]
    if (seen.has(label)) continue
    seen.add(label)
    const related = items.filter((i) => i.category === item.category)
    const desc = related[0]?.description ?? label
    bullets.push(`${label}: ${desc}`)
    if (bullets.length >= 5) break
  }
  return bullets
}

export function LastServiceCard({ visit, lineItems, loading }: Props) {
  if (loading) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-400">Loading last service…</p>
      </section>
    )
  }

  if (!visit) {
    return (
      <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-4">
        <h2 className="text-lg font-semibold">Last service</h2>
        <p className="mt-2 text-sm text-slate-400">No confirmed visits yet. Log your first repair bill.</p>
      </section>
    )
  }

  const bullets = summarizeCategories(lineItems)

  return (
    <section className="rounded-xl border border-sky-900/50 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-sky-100">Last service</h2>
        <Link to={`/visits/${visit.id}`} className="text-sm text-sky-400">
          Details →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-300">
        {formatDate(visit.service_date)}
        {visit.shop_name ? ` · ${visit.shop_name}` : ''}
      </p>
      <p className="text-sm text-slate-400">
        {formatMileage(visit.odometer)} · {formatMoney(visit.total_cents, visit.currency)}
      </p>
      {bullets.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-200">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-sky-500">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {visit.advisor_notes && (
        <p className="mt-3 rounded-lg bg-slate-800/80 p-2 text-sm italic text-slate-300">
          Note: {visit.advisor_notes}
        </p>
      )}
    </section>
  )
}
