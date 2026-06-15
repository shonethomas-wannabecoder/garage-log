export interface BrandInfo {
  slug: string
  color: string
}

// make (normalized: lowercase, letters only) -> Simple Icons slug + brand color
const BRANDS: Record<string, BrandInfo> = {
  volkswagen: { slug: 'volkswagen', color: '#001E50' },
  vw: { slug: 'volkswagen', color: '#001E50' },
  toyota: { slug: 'toyota', color: '#EB0A1E' },
  honda: { slug: 'honda', color: '#E40521' },
  ford: { slug: 'ford', color: '#066FEF' },
  bmw: { slug: 'bmw', color: '#0066B1' },
  audi: { slug: 'audi', color: '#BB0A30' },
  mercedes: { slug: 'mercedes', color: '#000000' },
  mercedesbenz: { slug: 'mercedes', color: '#000000' },
  benz: { slug: 'mercedes', color: '#000000' },
  tesla: { slug: 'tesla', color: '#CC0000' },
  nissan: { slug: 'nissan', color: '#C3002F' },
  hyundai: { slug: 'hyundai', color: '#002C5F' },
  kia: { slug: 'kia', color: '#05141F' },
  chevrolet: { slug: 'chevrolet', color: '#D1A53C' },
  chevy: { slug: 'chevrolet', color: '#D1A53C' },
  subaru: { slug: 'subaru', color: '#013C74' },
  mazda: { slug: 'mazda', color: '#101010' },
  jeep: { slug: 'jeep', color: '#000000' },
  volvo: { slug: 'volvo', color: '#003057' },
  porsche: { slug: 'porsche', color: '#B12B28' },
  lexus: { slug: 'lexus', color: '#1A1A1A' },
  dodge: { slug: 'dodge', color: '#000000' },
  jaguar: { slug: 'jaguar', color: '#9C8E5A' },
  landrover: { slug: 'landrover', color: '#005A2B' },
  mini: { slug: 'mini', color: '#000000' },
  fiat: { slug: 'fiat', color: '#941711' },
  peugeot: { slug: 'peugeot', color: '#000000' },
  renault: { slug: 'renault', color: '#FFCC33' },
  skoda: { slug: 'skoda', color: '#0E3A2F' },
  seat: { slug: 'seat', color: '#33302E' },
  acura: { slug: 'acura', color: '#000000' },
  infiniti: { slug: 'infiniti', color: '#000000' },
  mitsubishi: { slug: 'mitsubishi', color: '#E60012' },
  suzuki: { slug: 'suzuki', color: '#E30613' },
  ferrari: { slug: 'ferrari', color: '#D40000' },
  lamborghini: { slug: 'lamborghini', color: '#DDB321' },
  maserati: { slug: 'maserati', color: '#0C2340' },
  bentley: { slug: 'bentley', color: '#1A1A1A' },
  bugatti: { slug: 'bugatti', color: '#0E2E5C' },
  astonmartin: { slug: 'astonmartin', color: '#00665E' },
  cadillac: { slug: 'cadillac', color: '#000000' },
  chrysler: { slug: 'chrysler', color: '#000000' },
}

function normalize(make: string): string {
  return make.trim().toLowerCase().replace(/[^a-z]/g, '')
}

export function brandFor(make?: string | null): BrandInfo | null {
  if (!make) return null
  return BRANDS[normalize(make)] ?? null
}

export function brandColor(make?: string | null): string | null {
  return brandFor(make)?.color ?? null
}

export function brandMonogram(make?: string | null): string {
  if (!make) return ''
  return make.trim().slice(0, 2).toUpperCase()
}

export function brandLogoUrl(slug: string, hex = 'ffffff'): string {
  return `https://cdn.simpleicons.org/${slug}/${hex}`
}
