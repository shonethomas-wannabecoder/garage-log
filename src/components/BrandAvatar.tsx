import { useState } from 'react'
import { Car } from 'lucide-react'
import { brandFor, brandLogoUrl, brandMonogram } from '../lib/vehicleBrand'

interface Props {
  make?: string | null
  size?: number
  className?: string
}

export function BrandAvatar({ make, size = 38, className = '' }: Props) {
  const brand = brandFor(make)
  const [imgFailed, setImgFailed] = useState(false)

  const base = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`
  const dims = { width: size, height: size }

  // Unknown make → generic glass car badge
  if (!brand) {
    return (
      <span
        className={`${base} border border-white/15 text-white`}
        style={{ ...dims, background: 'var(--grad)' }}
        aria-hidden
      >
        <Car size={size * 0.5} />
      </span>
    )
  }

  return (
    <span
      className={`${base} border border-white/15`}
      style={{ ...dims, background: brand.color }}
      aria-hidden
    >
      {!imgFailed ? (
        <img
          src={brandLogoUrl(brand.slug)}
          alt=""
          width={size * 0.56}
          height={size * 0.56}
          style={{ width: size * 0.56, height: size * 0.56, objectFit: 'contain' }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="font-semibold text-white" style={{ fontSize: size * 0.36 }}>
          {brandMonogram(make)}
        </span>
      )}
    </span>
  )
}
