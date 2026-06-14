import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { formatDate, formatMoney } from '../lib/format'
import type { ServiceVisit } from '../types'

export function VisitListItem({ visit }: { visit: ServiceVisit }) {
  return (
    <Link
      to={`/visits/${visit.id}`}
      className="card flex items-center justify-between px-4 py-3 active:bg-surface-2"
    >
      <div>
        <p className="font-medium">{formatDate(visit.service_date)}</p>
        <p className="text-sm text-muted">{visit.shop_name ?? 'Unknown shop'}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-content">{formatMoney(visit.total_cents, visit.currency)}</p>
        <ChevronRight size={16} className="text-faint" aria-hidden />
      </div>
    </Link>
  )
}
