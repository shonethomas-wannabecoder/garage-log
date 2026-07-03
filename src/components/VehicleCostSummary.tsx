import { DollarSign } from 'lucide-react'
import { useVehicleCosts } from '../hooks/useVehicleCosts'
import { formatMoney } from '../lib/format'

export function VehicleCostSummary({ vehicleId }: { vehicleId: string }) {
  const { costs, loading } = useVehicleCosts(vehicleId)

  if (loading) {
    return <div className="skeleton h-28 mt-2" />
  }

  if (!costs || costs.visitCount === 0) {
    return (
      <p className="mt-2 text-xs text-faint">No confirmed visits yet.</p>
    )
  }

  const thisYear = new Date().getFullYear()
  const rows: { label: string; value: string }[] = []

  if (costs.sinceLastService != null) {
    rows.push({ label: 'Last service', value: formatMoney(costs.sinceLastService) })
  }
  rows.push({ label: `${thisYear}`, value: formatMoney(costs.thisYear) })
  rows.push({ label: `${thisYear - 1}`, value: formatMoney(costs.lastYear) })
  rows.push({ label: 'Lifetime', value: formatMoney(costs.lifetime) })

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-faint">
        <DollarSign size={13} aria-hidden />
        Spend · {costs.visitCount} visit{costs.visitCount !== 1 ? 's' : ''}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="text-xs text-muted">{r.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-content">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
