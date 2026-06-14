import { createElement, type ReactNode } from 'react'
import { categoryChipClass, categoryIcon } from '../lib/category'
import { CATEGORY_LABELS, type ServiceCategory } from '../types'

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-faint">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function CategoryChip({ category }: { category: ServiceCategory }) {
  return (
    <span className={`chip ${categoryChipClass(category)}`}>
      {createElement(categoryIcon(category), { size: 13, strokeWidth: 2.25, 'aria-hidden': true })}
      {CATEGORY_LABELS[category]}
    </span>
  )
}
