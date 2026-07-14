import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../contexts/HouseholdContext'
import { computeNextFactoryService } from '../lib/nextFactoryService'
import { formatMoney } from '../lib/format'
import type { ServiceVisit, Vehicle } from '../types'

interface OverviewRow {
  vehicle: Vehicle
  pendingCount: number
  yearSpend: number
  nextDue: string | null
}

export function GarageOverview() {
  const { vehicles } = useHousehold()
  const [rows, setRows] = useState<OverviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehicles.length) {
      setRows([])
      setLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      setLoading(true)
      const year = new Date().getFullYear()
      const next: OverviewRow[] = []

      for (const vehicle of vehicles) {
        const [{ data: pending }, { data: confirmed }] = await Promise.all([
          supabase
            .from('service_visits')
            .select('id')
            .eq('vehicle_id', vehicle.id)
            .in('parse_status', ['pending', 'needs_review']),
          supabase
            .from('service_visits')
            .select('service_date, total_cents, odometer, parse_status')
            .eq('vehicle_id', vehicle.id)
            .eq('parse_status', 'confirmed'),
        ])

        const visits = (confirmed ?? []) as Pick<
          ServiceVisit,
          'service_date' | 'total_cents' | 'odometer' | 'parse_status'
        >[]
        const yearSpend = visits
          .filter((v) => v.service_date.startsWith(String(year)))
          .reduce((s, v) => s + (v.total_cents ?? 0), 0)

        let miles: number | null = vehicle.current_odometer
        for (const v of visits) {
          if (v.odometer != null && (miles == null || v.odometer > miles)) miles = v.odometer
        }
        const rec = computeNextFactoryService(vehicle, miles)

        next.push({
          vehicle,
          pendingCount: pending?.length ?? 0,
          yearSpend,
          nextDue: rec
            ? rec.milesUntil == null
              ? rec.title
              : rec.status === 'overdue'
                ? `Overdue · ${rec.title}`
                : `In ${rec.milesUntil.toLocaleString()} mi · ${rec.title}`
            : null,
        })
      }

      if (!cancelled) {
        setRows(next)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [vehicles])

  const totalYear = useMemo(() => rows.reduce((s, r) => s + r.yearSpend, 0), [rows])
  const totalPending = useMemo(() => rows.reduce((s, r) => s + r.pendingCount, 0), [rows])

  if (vehicles.length < 2) return null

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-center gap-2 text-brand">
        <LayoutGrid size={18} aria-hidden />
        <h2 className="text-base font-semibold text-content">Garage overview</h2>
      </div>
      <p className="text-sm text-muted">
        {loading
          ? 'Loading household totals…'
          : `${formatMoney(totalYear)} YTD across ${vehicles.length} cars${
              totalPending ? ` · ${totalPending} need review` : ''
            }`}
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.vehicle.id} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-content">{r.vehicle.nickname}</p>
              <p className="text-sm text-muted">{formatMoney(r.yearSpend)} YTD</p>
            </div>
            {r.pendingCount > 0 && (
              <p className="mt-0.5 text-xs text-on-warn-soft">{r.pendingCount} pending review</p>
            )}
            {r.nextDue && <p className="mt-0.5 text-xs text-faint">{r.nextDue}</p>}
          </li>
        ))}
      </ul>
      <Link to="/vehicles" className="text-sm font-medium text-brand">
        Manage cars →
      </Link>
    </section>
  )
}
