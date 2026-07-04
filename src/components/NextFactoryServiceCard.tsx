import { CalendarClock, ExternalLink, Gauge } from 'lucide-react'
import { MileageRing } from './MileageRing'
import { formatDate, formatMileage } from '../lib/format'
import { VW_SERVICE_TYPE_SUMMARY, vwServiceTypeLabel } from '../lib/oemSchedules/volkswagen2020usa'
import type { NextFactoryService } from '../lib/nextFactoryService'

const MILESTONE_INTERVAL_MILES = 10_000

interface Props {
  recommendation: NextFactoryService | null
  loading: boolean
  hasVisits: boolean
  /** Service date of the visit that produced the latest odometer reading */
  asOfDate?: string | null
}

function milestoneShort(miles: number): string {
  return miles % 1000 === 0 ? `${miles / 1000}k` : miles.toLocaleString()
}

function ringProps(rec: NextFactoryService): {
  value: string
  valueLabel: string
  subLabel: string
  fraction: number
  tone: 'brand' | 'warn'
} | null {
  if (rec.milesUntil == null) return null
  const target = milestoneShort(rec.milestoneMiles)
  if (rec.status === 'overdue') {
    return {
      value: Math.abs(rec.milesUntil).toLocaleString(),
      valueLabel: `mi past ${target} service`,
      subLabel: 'past due',
      fraction: 1,
      tone: 'warn',
    }
  }
  const fraction = 1 - rec.milesUntil / MILESTONE_INTERVAL_MILES
  if (rec.status === 'due_now') {
    return {
      value: rec.milesUntil.toLocaleString(),
      valueLabel: `mi until ${target} service`,
      subLabel: 'due now',
      fraction,
      tone: 'warn',
    }
  }
  return {
    value: rec.milesUntil.toLocaleString(),
    valueLabel: `mi until ${target} service`,
    subLabel: 'on track',
    fraction,
    tone: 'brand',
  }
}

export function NextFactoryServiceCard({ recommendation, loading, hasVisits, asOfDate }: Props) {
  if (loading) {
    return (
      <section className="card p-4">
        <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
        <div className="mx-auto mt-4 h-40 w-40 animate-pulse rounded-full bg-surface-2" />
        <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-surface-2" />
      </section>
    )
  }

  if (!recommendation) return null

  const ring = ringProps(recommendation)

  return (
    <section className="card space-y-3 p-4">
      <div>
        <div className="flex items-center gap-2 text-brand">
          <CalendarClock size={18} aria-hidden />
          <h2 className="text-base font-semibold text-content">Next factory service</h2>
        </div>
        <p className="mt-0.5 text-xs text-faint">{recommendation.scheduleLabel}</p>
      </div>

      {ring && (
        <div className="flex flex-col items-center">
          <MileageRing {...ring} />
          {recommendation.currentMiles != null && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <Gauge size={13} aria-hidden />
              Based on {formatMileage(recommendation.currentMiles)}
              {asOfDate ? ` logged ${formatDate(asOfDate)}` : ' from your last logged visit'}
            </p>
          )}
        </div>
      )}

      <div>
        <p className="text-lg font-semibold">{recommendation.title}</p>
        {!ring && recommendation.currentMiles != null && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Gauge size={14} aria-hidden />
            Latest logged mileage: {formatMileage(recommendation.currentMiles)}
          </p>
        )}
      </div>

      <ul className="space-y-2 text-sm text-muted">
        {recommendation.serviceTypes.map((type) => (
          <li key={type}>
            <span className="font-medium text-content">{vwServiceTypeLabel(type)}</span>
            <span className="text-faint"> — {VW_SERVICE_TYPE_SUMMARY[type]}</span>
          </li>
        ))}
      </ul>

      {recommendation.additionalItems.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-faint">Also due at this mileage</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-muted">
            {recommendation.additionalItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {!hasVisits && (
        <p className="text-sm text-muted">
          Log a service visit with mileage to see how close you are to this interval.
        </p>
      )}

      {recommendation.milesUntil == null && hasVisits && (
        <p className="text-sm text-muted">
          Add mileage to your most recent visit so we can estimate when this service is due.
        </p>
      )}

      <p className="text-xs text-faint">
        Factory schedule only — not a dealer upsell list. Brake fluid is also due every 2 years regardless of mileage.{' '}
        <a
          href={recommendation.source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-brand"
        >
          Official VW source
          <ExternalLink size={12} aria-hidden />
        </a>
      </p>
    </section>
  )
}
