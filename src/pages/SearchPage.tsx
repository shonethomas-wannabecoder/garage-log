import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { VehicleSelect } from '../components/VehicleSelect'
import { VisitListItem } from '../components/VisitListItem'
import { PageHeader } from '../components/ui'
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
    <div className="space-y-5">
      <PageHeader title="Search" subtitle="Find past work by keyword (brakes, oil, filter…)." />

      <VehicleSelect />

      {vehicles.length > 0 && (
        <>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              placeholder="Search line items…"
              className="field pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="text-sm text-muted">Searching…</p>
          ) : (
            <ul className="space-y-2">
              {results.map((v) => (
                <li key={v.id}>
                  <VisitListItem visit={v} />
                </li>
              ))}
              {!results.length && <p className="text-sm text-muted">No matches.</p>}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
