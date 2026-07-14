import { Link } from 'react-router-dom'
import { AlertCircle, ClipboardCheck, Search } from 'lucide-react'
import { NextFactoryServiceCard } from '../components/NextFactoryServiceCard'
import { LastServiceCard } from '../components/LastServiceCard'
import { VehicleSelect } from '../components/VehicleSelect'
import { VehicleShopConcerns } from '../components/VehicleShopConcerns'
import { UpdateMileageCard } from '../components/UpdateMileageCard'
import { ReminderBadges } from '../components/ReminderBadges'
import { GarageOverview } from '../components/GarageOverview'
import { OfflineQueueBanner } from '../components/OfflineQueueBanner'
import { PageHeader } from '../components/ui'
import { useHousehold } from '../contexts/HouseholdContext'
import { useNextFactoryService } from '../hooks/useNextFactoryService'
import {
  useCategoryHistory,
  usePendingVisits,
  useVisitDetail,
  useVisits,
} from '../hooks/useVisits'
import { buildReminders } from '../lib/reminders'
import { trackEvent } from '../lib/analytics'
import { formatDate, formatMoney } from '../lib/format'
import { useEffect, useMemo } from 'react'

export function HomePage() {
  const { household, selectedVehicleId, vehicles } = useHousehold()
  const { visits, loading: visitsLoading } = useVisits(selectedVehicleId)
  const { visits: pendingVisits } = usePendingVisits(selectedVehicleId)
  const { recommendation: nextFactoryService, currentMiles, currentMilesDate } =
    useNextFactoryService(selectedVehicleId, visits)
  const { history } = useCategoryHistory(selectedVehicleId)
  const lastVisit = visits[0] ?? null
  const { lineItems, loading: detailLoading } = useVisitDetail(lastVisit?.id)

  const reminders = useMemo(
    () => buildReminders(history, currentMiles),
    [history, currentMiles],
  )

  useEffect(() => {
    void trackEvent('home_viewed', { vehicle_count: vehicles.length })
  }, [vehicles.length])

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={household?.name ?? 'My garage'}
        title="Your garage"
        subtitle="Know what was done — before the shop tells you what's due."
      />

      <GarageOverview />

      <OfflineQueueBanner />

      <div className="lg:hidden">
        <VehicleSelect />
      </div>

      <UpdateMileageCard vehicleId={selectedVehicleId} />

      {vehicles.length > 0 && (visitsLoading || nextFactoryService) && (
        <section>
          <h2 className="mb-2 text-base font-semibold">Up next</h2>
          <NextFactoryServiceCard
            recommendation={nextFactoryService}
            loading={visitsLoading}
            hasVisits={visits.length > 0}
            asOfDate={currentMilesDate}
          />
        </section>
      )}

      <ReminderBadges reminders={reminders} />

      <VehicleShopConcerns />

      {pendingVisits.length > 0 && (
        <section className="rounded-2xl border border-warn/40 bg-warn-soft p-4">
          <div className="flex items-center gap-2 text-on-warn-soft">
            <AlertCircle size={16} aria-hidden />
            <h2 className="text-sm font-semibold">Needs review</h2>
          </div>
          <ul className="mt-2 space-y-1.5">
            {pendingVisits.map((v) => (
              <li key={v.id}>
                <Link
                  to={`/visits/${v.id}/review`}
                  className="flex justify-between text-sm text-on-warn-soft"
                >
                  <span>
                    {formatDate(v.service_date)}
                    {v.shop_name ? ` · ${v.shop_name}` : ''}
                  </span>
                  <span className="font-medium">
                    {v.parse_status === 'pending' ? 'Finish →' : 'Review →'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vehicles.length > 0 && (
        <>
          <Link to="/compare" className="accent-banner block p-4 active:opacity-95">
            <div className="flex items-center gap-2 text-white">
              <ClipboardCheck size={18} aria-hidden />
              <span className="text-base font-semibold">Compare a quote</span>
            </div>
            <p className="mt-1 text-sm text-white/85">
              At the shop? Check today's recommendations against your real history.
            </p>
          </Link>

          <section>
            <h2 className="mb-2 text-base font-semibold">Last service</h2>
            <LastServiceCard
              visit={lastVisit}
              lineItems={lineItems}
              loading={visitsLoading || detailLoading}
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold">History</h2>
              <Link to="/search" className="flex items-center gap-1 text-sm font-medium text-brand">
                <Search size={14} aria-hidden />
                Search
              </Link>
            </div>

            {visitsLoading ? (
              <div className="space-y-2.5" role="status" aria-label="Loading history">
                <div className="skeleton h-16" />
                <div className="skeleton h-16" />
                <div className="skeleton h-16" />
              </div>
            ) : visits.length === 0 ? (
              <p className="text-sm text-muted">
                No visits yet. Tap <strong className="font-medium text-content">Log</strong> below to
                scan your first bill.
              </p>
            ) : (
              <ol className="relative ml-1.5 space-y-2.5 border-l border-line pl-5">
                {visits.map((v, i) => (
                  <li key={v.id} className="relative">
                    <span
                      className={`absolute -left-[26px] top-4 h-2.5 w-2.5 rounded-full ring-4 ring-bg ${
                        i === 0 ? 'bg-brand' : 'bg-line-strong'
                      }`}
                      aria-hidden
                    />
                    <Link
                      to={`/visits/${v.id}`}
                      className="card flex items-center justify-between px-3.5 py-3 active:bg-surface-2"
                    >
                      <div>
                        <p className="font-medium">{formatDate(v.service_date)}</p>
                        <p className="text-sm text-muted">{v.shop_name ?? 'Unknown shop'}</p>
                      </div>
                      <p className="text-sm text-muted">{formatMoney(v.total_cents, v.currency)}</p>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  )
}
