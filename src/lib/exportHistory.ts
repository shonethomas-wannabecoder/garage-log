import { formatDate, formatMileage, formatMoney } from './format'
import type { LineItem, ServiceVisit, Vehicle } from '../types'

export function exportVehicleHistory(
  vehicle: Vehicle,
  visits: ServiceVisit[],
  linesByVisit: Record<string, LineItem[]>,
) {
  const header = [
    `Garage Log — ${vehicle.nickname}`,
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' '),
    vehicle.vin ? `VIN: ${vehicle.vin}` : null,
    `Exported ${new Date().toISOString().slice(0, 10)}`,
    '',
  ].filter(Boolean)

  const body = visits.flatMap((v) => {
    const lines = linesByVisit[v.id] ?? []
    return [
      `## ${formatDate(v.service_date)} · ${v.shop_name ?? 'Unknown shop'}`,
      `${formatMileage(v.odometer)} · ${formatMoney(v.total_cents, v.currency)}`,
      v.invoice_number ? `Invoice #${v.invoice_number}` : null,
      v.advisor_notes ? `Notes: ${v.advisor_notes}` : null,
      ...lines.map(
        (l) =>
          `  - ${l.description}${l.line_total_cents != null ? ` · ${formatMoney(l.line_total_cents)}` : ''}`,
      ),
      '',
    ].filter(Boolean) as string[]
  })

  const blob = new Blob([[...header, ...body].join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `garage-log-${vehicle.nickname.replace(/\s+/g, '-').toLowerCase()}-history.txt`
  a.click()
  URL.revokeObjectURL(url)
}
