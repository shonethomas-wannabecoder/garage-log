import { useParams } from 'react-router-dom'
import { formatDate, formatMileage, formatMoney } from '../lib/format'
import { useVisitDetail } from '../hooks/useVisits'
import { CATEGORY_LABELS } from '../types'

export function VisitPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const { visit, lineItems, loading, error } = useVisitDetail(visitId)

  if (loading) return <p className="text-slate-400">Loading…</p>
  if (error || !visit) return <p className="text-red-400">{error ?? 'Visit not found'}</p>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{formatDate(visit.service_date)}</h1>
        <p className="text-slate-300">{visit.shop_name ?? 'Unknown shop'}</p>
        <p className="text-sm text-slate-400">
          {formatMileage(visit.odometer)} · {formatMoney(visit.total_cents, visit.currency)}
        </p>
        {visit.invoice_number && (
          <p className="text-sm text-slate-500">Invoice #{visit.invoice_number}</p>
        )}
      </header>

      {visit.advisor_notes && (
        <blockquote className="rounded-lg border-l-4 border-sky-600 bg-slate-900 p-3 text-sm italic">
          {visit.advisor_notes}
        </blockquote>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Work performed</h2>
        <ul className="space-y-2">
          {lineItems.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <p className="font-medium">{item.description}</p>
              <p className="text-sm text-slate-400">
                {CATEGORY_LABELS[item.category]} · {item.item_type}
                {item.line_total_cents != null && ` · ${formatMoney(item.line_total_cents)}`}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
