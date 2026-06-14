import { Link } from 'react-router-dom'
import { LastServiceCard } from '../components/LastServiceCard'
import { VehicleSelect } from '../components/VehicleSelect'
import { VisitListItem } from '../components/VisitListItem'
import { useHousehold } from '../contexts/HouseholdContext'
import { useVisitDetail, useVisits } from '../hooks/useVisits'

export function HomePage() {
  const { household, selectedVehicleId, vehicles } = useHousehold()
  const { visits, loading: visitsLoading } = useVisits(selectedVehicleId)
  const lastVisit = visits[0] ?? null
  const { lineItems, loading: detailLoading } = useVisitDetail(lastVisit?.id)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">{household?.name ?? 'Garage Log'}</p>
        <h1 className="text-2xl font-bold">Advisor check</h1>
        <p className="text-sm text-slate-400">Pull up what you actually had done last time.</p>
      </header>

      <VehicleSelect />

      {vehicles.length > 0 && (
        <>
          <LastServiceCard visit={lastVisit} lineItems={lineItems} loading={visitsLoading || detailLoading} />

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">History</h2>
              <Link to="/search" className="text-sm text-sky-400">
                Search
              </Link>
            </div>
            {visitsLoading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : visits.length === 0 ? (
              <p className="text-sm text-slate-400">No visits yet.</p>
            ) : (
              <ul className="space-y-2">
                {visits.map((v) => (
                  <li key={v.id}>
                    <VisitListItem visit={v} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
