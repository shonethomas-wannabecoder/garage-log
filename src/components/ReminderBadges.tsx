import { Bell } from 'lucide-react'
import type { ReminderItem } from '../lib/reminders'

export function ReminderBadges({ reminders }: { reminders: ReminderItem[] }) {
  if (!reminders.length) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-brand" aria-hidden />
        <h2 className="text-base font-semibold">Reminders</h2>
      </div>
      <ul className="space-y-2">
        {reminders.map((r) => (
          <li
            key={r.id}
            className={`card px-4 py-3 ${
              r.status === 'overdue' || r.status === 'due_now'
                ? 'border-warn/40 bg-warn-soft/40'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-content">{r.label}</p>
                <p className="mt-0.5 text-xs text-muted">{r.detail}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  r.status === 'overdue' || r.status === 'due_now'
                    ? 'bg-warn-soft text-on-warn-soft'
                    : 'bg-brand-soft text-on-brand-soft'
                }`}
              >
                {r.status === 'overdue' ? 'Overdue' : r.status === 'due_now' ? 'Due soon' : 'Upcoming'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
