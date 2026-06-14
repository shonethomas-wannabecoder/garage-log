export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-')
  if (!y || !m || !d) return iso
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatMoney(cents: number | null, currency = 'USD'): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100)
}

export function formatMileage(miles: number | null): string {
  if (miles == null) return '—'
  return `${miles.toLocaleString()} mi`
}
