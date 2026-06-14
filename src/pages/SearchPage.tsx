import { useEffect, useState } from 'react'
import { VehicleSelect } from '../components/VehicleSelect'
import { VisitListItem } from '../components/VisitListItem'
import { useHousehold } from '../contexts/HouseholdContext'
import { searchVisits } from '../hooks/useVisits'
import type { ServiceVisit } from '../types'

export function SearchPage() {
  const { selectedVehicleId, vehicles } = useHousehold()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ServiceVisit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedVehicleId) return
    const timer = setTimeout(async () => {
      setLoading(true)
      const { visits } = await searchVisits(selectedVehicleId, query)
      setResults(visits)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedVehicleId, query])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-slate-400">Find past work by keyword (brakes, oil, filter…).</p>
      </header>

      <VehicleSelect />

      {vehicles.length > 0 && (
        <>
          <input
            type="search"
            placeholder="Search line items…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <p className="text-sm text-slate-400">Searching…</p>
          ) : (
            <ul className="space-y-2">
              {results.map((v) => (
                <li key={v.id}>
                  <VisitListItem visit={v} />
                </li>
              ))}
              {!results.length && <p className="text-sm text-slate-400">No matches.</p>}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
