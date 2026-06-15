import { FileText } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { InvoicePagesGallery } from '../components/InvoicePagesGallery'
import { CategoryChip } from '../components/ui'
import { useVisitDetail } from '../hooks/useVisits'
import { formatDate, formatMileage, formatMoney } from '../lib/format'

export function VisitPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const { visit, lineItems, attachments, loading, error } = useVisitDetail(visitId)

  if (loading) return <p className="text-muted">Loading…</p>
  if (error || !visit) return <p className="text-danger">{error ?? 'Visit not found'}</p>

  if (visit.parse_status !== 'confirmed') {
    return <Navigate to={`/visits/${visitId}/review`} replace />
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{formatDate(visit.service_date)}</h1>
        <p className="mt-0.5 text-muted">{visit.shop_name ?? 'Unknown shop'}</p>
        <p className="mt-1 text-sm text-faint">
          {formatMileage(visit.odometer)} · {formatMoney(visit.total_cents, visit.currency)}
        </p>
        {visit.invoice_number && (
          <p className="text-sm text-faint">Invoice #{visit.invoice_number}</p>
        )}
      </header>

      <InvoicePagesGallery attachments={attachments} />

      {attachments.some((a) => a.mime_type === 'application/pdf') && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <FileText size={16} aria-hidden />
          Tap a PDF page above to open it.
        </p>
      )}

      {visit.advisor_notes && (
        <blockquote className="rounded-2xl border-l-4 border-brand bg-surface p-3 text-sm italic text-muted">
          {visit.advisor_notes}
        </blockquote>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">Work performed</h2>
        <ul className="space-y-2">
          {lineItems.map((item) => (
            <li key={item.id} className="card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{item.description}</p>
                {item.line_total_cents != null && (
                  <p className="shrink-0 text-sm text-muted">{formatMoney(item.line_total_cents)}</p>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <CategoryChip category={item.category} />
                <span className="text-xs capitalize text-faint">{item.item_type}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
