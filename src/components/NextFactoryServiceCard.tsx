import { CalendarClock, ExternalLink, Gauge } from 'lucide-react'
import { formatMileage } from '../lib/format'
import { VW_SERVICE_TYPE_SUMMARY, vwServiceTypeLabel } from '../lib/oemSchedules/volkswagen2020usa'
import type { NextFactoryService } from '../lib/nextFactoryService'

interface Props {
  recommendation: NextFactoryService | null
  loading: boolean
  hasVisits: boolean
}

function statusLabel(rec: NextFactoryService): string {
  if (rec.milesUntil == null) return 'Log mileage to personalize'
  if (rec.status === 'overdue') {
    return `${Math.abs(rec.milesUntil).toLocaleString()} mi past due`
  }
  if (rec.status === 'due_now') return 'Due now'
  return `In ${rec.milesUntil.toLocaleString()} mi`
}

function statusClass(rec: NextFactoryService): string {
  if (rec.status === 'overdue' || rec.status === 'due_now') {
    return 'bg-warn-soft text-on-warn-soft'
  }
  return 'bg-brand-soft text-on-brand-soft'
}

export function NextFactoryServiceCard({ recommendation, loading, hasVisits }: Props) {
  if (loading) {
    return (
      <section className="card p-4">
        <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-surface-2" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-surface-2" />
      </section>
    )
  }

  if (!recommendation) return null

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand">
            <CalendarClock size={18} aria-hidden />
            <h2 className="text-base font-semibold text-content">Next factory service</h2>
          </div>
          <p className="mt-0.5 text-xs text-faint">{recommendation.scheduleLabel}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(recommendation)}`}>
          {statusLabel(recommendation)}
        </span>
      </div>

      <div>
        <p className="text-lg font-semibold">{recommendation.title}</p>
        {recommendation.currentMiles != null && (
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
