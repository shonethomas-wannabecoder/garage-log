import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Flag, History, Sparkles, CircleAlert, Mic, MicOff } from 'lucide-react'
import { VehicleSelect } from '../components/VehicleSelect'
import { useDemoData } from '../demo/DemoDataProvider'
import { CategoryChip, PageHeader } from '../components/ui'
import { useHousehold } from '../contexts/HouseholdContext'
import { useSpeechInput } from '../hooks/useSpeechInput'
import { useCategoryHistory, useVisits, type CategoryHistory } from '../hooks/useVisits'
import { formatDate, formatMileage } from '../lib/format'
import { guessCategoryFromText } from '../lib/suggestCategory'
import { trackEvent } from '../lib/analytics'
import { CATEGORY_LABELS, type ServiceCategory } from '../types'

interface Recommended {
  id: string
  category: ServiceCategory
  description: string
}

function monthsSince(iso: string): number {
  const then = new Date(iso).getTime()
  const now = Date.now()
  return Math.max(0, Math.round((now - then) / (1000 * 60 * 60 * 24 * 30.44)))
}

function agoLabel(months: number): string {
  if (months < 1) return 'this month'
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  const years = Math.floor(months / 12)
  const rem = months % 12
  const y = `${years} yr${years > 1 ? 's' : ''}`
  return rem ? `${y} ${rem} mo ago` : `${y} ago`
}

type Verdict = 'recent' | 'due' | 'new'

function verdictOf(h: CategoryHistory | undefined): { v: Verdict; months: number } {
  if (!h) return { v: 'new', months: 0 }
  const months = monthsSince(h.serviceDate)
  return { v: months <= 12 ? 'recent' : 'due', months }
}

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string }> = {
  recent: { label: 'Done recently', cls: 'bg-warn-soft text-on-warn-soft' },
  due: { label: 'Likely due', cls: 'bg-ok-soft text-on-ok-soft' },
  new: { label: 'Not on file', cls: 'bg-brand-soft text-on-brand-soft' },
}

export function ComparePage() {
  const demo = useDemoData()
  const { selectedVehicleId, vehicles } = useHousehold()
  const { history } = useCategoryHistory(selectedVehicleId)
  const { visits } = useVisits(selectedVehicleId)

  const [items, setItems] = useState<Recommended[]>(() =>
    demo ? demo.compareSeed.map((item) => ({ ...item })) : [],
  )
  const [category, setCategory] = useState<ServiceCategory>('oil_fluid')
  const [description, setDescription] = useState('')
  const { isSupported, isListening, error: speechError, start, stop } = useSpeechInput()

  useEffect(() => {
    void trackEvent('compare_opened')
  }, [])

  function handleVoiceInput() {
    if (isListening) {
      stop()
      return
    }
    start((text, isFinal) => {
      setDescription(text)
      if (isFinal) {
        const guessed = guessCategoryFromText(text)
        if (guessed) setCategory(guessed)
      }
    })
  }

  const notesBlob = useMemo(
    () =>
      visits
        .map((v) => v.advisor_notes ?? '')
        .join(' \n ')
        .toLowerCase(),
    [visits],
  )

  function add() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category, description: description.trim() },
    ])
    setDescription('')
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function flaggedBefore(item: Recommended): boolean {
    if (!notesBlob) return false
    const term = item.description.toLowerCase()
    if (term.length >= 4 && notesBlob.includes(term)) return true
    return notesBlob.includes(CATEGORY_LABELS[item.category].toLowerCase())
  }

  if (!vehicles.length) {
    return (
      <div className="space-y-5">
        <PageHeader title="Advisor check" subtitle="Compare today's quote with your history." />
        <p className="text-sm text-muted">Add a vehicle first — then we can check quotes against its history.</p>
        <Link to="/vehicles" className="btn-primary block w-full py-3 text-center">
          Add a vehicle
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Advisor check"
        subtitle="Add what the shop is recommending today. We'll check it against your real history."
      />

      <VehicleSelect />

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Add a recommended item</h2>
        <p className="mt-1 text-xs text-muted">
          Type or tap the mic and say what the advisor is recommending.
        </p>
        <div className="mt-3 space-y-2">
          <select
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k} className="bg-surface text-content">
                {label}
              </option>
            ))}
          </select>
          <div className="relative">
            <textarea
              className="field min-h-[4.5rem] resize-none pr-12"
              placeholder="What did they suggest? (e.g. transmission flush)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            {isSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                aria-label={isListening ? 'Stop listening' : 'Speak recommendation'}
                className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isListening
                    ? 'bg-danger text-white animate-pulse'
                    : 'bg-surface-2 text-muted active:bg-brand-soft active:text-brand'
                }`}
              >
                {isListening ? <MicOff size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
              </button>
            )}
          </div>
          {isListening && (
            <p className="text-xs text-brand">Listening… say what they&apos;re recommending.</p>
          )}
          {speechError && <p className="text-xs text-danger">{speechError}</p>}
          <button
            type="button"
            onClick={add}
            disabled={!description.trim()}
            className="btn-primary flex w-full items-center justify-center gap-1.5 py-2.5 text-sm disabled:opacity-50"
          >
            <Plus size={16} aria-hidden />
            Add to compare
          </button>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center border-dashed px-4 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-faint">
            <Sparkles size={22} aria-hidden />
          </span>
          <p className="mt-3 text-sm text-muted">
            Add the items from the shop's quote above to see what you've already had done.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const h = history[item.category]
            const { v, months } = verdictOf(h)
            const flagged = flaggedBefore(item)
            const style = VERDICT_STYLE[v]
            return (
              <li key={item.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <CategoryChip category={item.category} />
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="Remove item"
                    className="text-faint active:text-content"
                  >
                    <X size={16} />
                  </button>
                </div>

                {item.description && (
                  <p className="mt-2 font-medium">{item.description}</p>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`chip ${style.cls}`}>{style.label}</span>
                  {flagged && (
                    <span className="chip bg-danger-soft text-on-danger-soft">
                      <Flag size={12} aria-hidden />
                      You flagged this before
                    </span>
                  )}
                </div>

                {h ? (
                  <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted">
                      <History size={14} aria-hidden />
                      <span>
                        Last done <span className="font-medium text-content">{agoLabel(months)}</span>
                        {' · '}
                        {formatDate(h.serviceDate)}
                      </span>
                    </div>
                    <p className="mt-1 text-muted">
                      {[h.shopName, formatMileage(h.odometer)].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1.5 text-content">{h.descriptions.slice(0, 3).join(', ')}</p>
                    <Link to={`/visits/${h.visitId}`} className="mt-1.5 inline-block text-sm font-medium text-brand">
                      View that visit →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                    <CircleAlert size={14} aria-hidden />
                    No record of this category in your history.
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
