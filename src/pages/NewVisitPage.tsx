import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VehicleSelect } from '../components/VehicleSelect'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { createVisitWithLines } from '../hooks/useVisits'
import type { LineItemDraft, LineItemType, ServiceCategory } from '../types'
import { CATEGORY_LABELS } from '../types'

const emptyLine = (): LineItemDraft => ({
  description: '',
  category: 'other',
  item_type: 'part',
  quantity: 1,
  unit_price_cents: null,
  line_total_cents: null,
})

export function NewVisitPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { household, selectedVehicleId, vehicles } = useHousehold()
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [odometer, setOdometer] = useState('')
  const [shopName, setShopName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [totalDollars, setTotalDollars] = useState('')
  const [advisorNotes, setAdvisorNotes] = useState('')
  const [lines, setLines] = useState<LineItemDraft[]>([emptyLine()])
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function updateLine(index: number, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedVehicleId || !user || !household) {
      setError('Select a vehicle first.')
      return
    }

    const validLines = lines.filter((l) => l.description.trim())
    if (!validLines.length) {
      setError('Add at least one line item.')
      return
    }

    setSaving(true)
    setError(null)

    const total_cents = totalDollars
      ? Math.round(parseFloat(totalDollars) * 100)
      : validLines.reduce((sum, l) => sum + (l.line_total_cents ?? 0), 0) || null

    const result = await createVisitWithLines(
      selectedVehicleId,
      {
        service_date: serviceDate,
        odometer: odometer ? parseInt(odometer, 10) : null,
        shop_name: shopName.trim() || null,
        invoice_number: invoiceNumber.trim() || null,
        total_cents,
        advisor_notes: advisorNotes.trim() || null,
      },
      validLines,
      file,
      household.id,
      user.id,
    )

    setSaving(false)
    if (result.error) setError(result.error)
    else if (result.visitId) navigate(`/visits/${result.visitId}`)
  }

  if (!vehicles.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Log service</h1>
        <p className="mt-2 text-slate-400">Add a vehicle under Cars before logging a visit.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Log service</h1>
        <p className="text-sm text-slate-400">Upload the bill and enter what was done (AI parsing comes next).</p>
      </header>

      <VehicleSelect />

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">Service date</span>
          <input
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-400">Mileage</span>
            <input
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Total ($)</span>
            <input
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
              value={totalDollars}
              onChange={(e) => setTotalDollars(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-slate-400">Shop name</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Invoice #</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Your notes (for next visit)</span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            placeholder="e.g. They pushed a transmission flush again"
            value={advisorNotes}
            onChange={(e) => setAdvisorNotes(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Invoice photo or PDF</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="mt-1 w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="font-semibold">Line items</legend>
          {lines.map((line, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-slate-800 p-3">
              <input
                placeholder="Description"
                required={index === 0}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                value={line.description}
                onChange={(e) => updateLine(index, { description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                  value={line.category}
                  onChange={(e) => updateLine(index, { category: e.target.value as ServiceCategory })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                  value={line.item_type}
                  onChange={(e) => updateLine(index, { item_type: e.target.value as LineItemType })}
                >
                  <option value="part">Part</option>
                  <option value="labor">Labor</option>
                  <option value="fee">Fee</option>
                  <option value="tax">Tax</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input
                inputMode="decimal"
                placeholder="Line total ($)"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                onChange={(e) => {
                  const v = e.target.value
                  updateLine(index, {
                    line_total_cents: v ? Math.round(parseFloat(v) * 100) : null,
                  })
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-sky-400"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            + Add line item
          </button>
        </fieldset>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-sky-600 py-3 font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save visit'}
        </button>
      </form>
    </div>
  )
}
