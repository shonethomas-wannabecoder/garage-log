import { Link } from 'react-router-dom'
import { formatDate, formatMoney } from '../lib/format'
import type { ServiceVisit } from '../types'

export function VisitListItem({ visit }: { visit: ServiceVisit }) {
  return (
    <Link
      to={`/visits/${visit.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 active:bg-slate-800"
    >
      <div>
        <p className="font-medium">{formatDate(visit.service_date)}</p>
        <p className="text-sm text-slate-400">{visit.shop_name ?? 'Unknown shop'}</p>
      </div>
      <p className="text-sm text-slate-300">{formatMoney(visit.total_cents, visit.currency)}</p>
    </Link>
  )
}
