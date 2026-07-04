const SIZE = 168
const STROKE = 11
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function MileageRing({
  value,
  valueLabel,
  subLabel,
  fraction,
  tone = 'brand',
}: {
  /** Big number shown in the center, already formatted (e.g. "8,034") */
  value: string
  /** Line under the number (e.g. "mi until 100k service") */
  valueLabel: string
  /** Small status line at the bottom of the ring (e.g. "on track") */
  subLabel?: string
  /** 0–1 progress toward the next service */
  fraction: number
  tone?: 'brand' | 'warn'
}) {
  const clamped = Math.min(1, Math.max(0, fraction))
  const dash = clamped * CIRCUMFERENCE
  const stroke = tone === 'warn' ? 'var(--warn)' : 'var(--brand)'

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`${value} ${valueLabel}${subLabel ? `, ${subLabel}` : ''}`}
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--line)"
        strokeWidth={STROKE}
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={SIZE / 2}
        y={SIZE / 2 - 6}
        textAnchor="middle"
        fontSize="27"
        fontWeight="600"
        fill="var(--content)"
      >
        {value}
      </text>
      <text x={SIZE / 2} y={SIZE / 2 + 14} textAnchor="middle" fontSize="11.5" fill="var(--muted)">
        {valueLabel}
      </text>
      {subLabel && (
        <text x={SIZE / 2} y={SIZE / 2 + 32} textAnchor="middle" fontSize="11.5" fill={stroke}>
          {subLabel}
        </text>
      )}
    </svg>
  )
}
