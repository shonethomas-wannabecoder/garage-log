import { type FormEvent, useRef, useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VehicleSelect } from '../components/VehicleSelect'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import {
  createPendingVisitWithFile,
  createVisitWithLines,
  invokeParseInvoice,
} from '../hooks/useVisits'
import { InvoiceFileError, prepareInvoiceFile } from '../lib/prepareInvoiceFile'
import type { LineItemDraft, LineItemType, ServiceCategory } from '../types'
import { CATEGORY_LABELS } from '../types'
import { PageHeader } from '../components/ui'

const emptyLine = (): LineItemDraft => ({
  description: '',
  category: 'other',
  item_type: 'part',
  quantity: 1,
  unit_price_cents: null,
  line_total_cents: null,
})

type Mode = 'scan' | 'manual'

export function NewVisitPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { household, selectedVehicleId, vehicles } = useHousehold()
  const [mode, setMode] = useState<Mode>('scan')
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
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  function onFilePicked(next: File | null) {
    setFile(next)
    setError(null)
  }

  async function uploadAndParse(uploadFile: File) {
    if (!selectedVehicleId || !household) return

    setSaving(true)
    setError(null)

    let prepared: File
    try {
      prepared = await prepareInvoiceFile(uploadFile)
    } catch (err) {
      setSaving(false)
      setError(
        err instanceof InvoiceFileError
          ? err.message
          : 'Could not read that photo. Tap Take photo, or use Enter manually.',
      )
      return
    }

    const created = await createPendingVisitWithFile(selectedVehicleId, prepared, household.id)
    if (created.error || !created.visitId) {
      setSaving(false)
      setError(created.error ?? 'Failed to upload')
      return
    }

    const parsed = await invokeParseInvoice(created.visitId)
    setSaving(false)

    if (parsed.error) {
      setError(parsed.error)
    } else if (parsed.lineCount === 0) {
      setError('Upload worked but nothing was read from the bill. You can retry on the next screen or fill in by hand.')
    }

    navigate(`/visits/${created.visitId}/review`)
  }

  async function handleScanSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Take a photo or choose an image first.')
      return
    }
    await uploadAndParse(file)
  }

  function updateLine(index: number, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  async function handleManualSubmit(e: FormEvent) {
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
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Log service</h1>
        <p className="text-muted">Add a vehicle under Cars before logging a visit.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Log service" subtitle="Upload a bill for AI parsing, or enter details manually." />

      <VehicleSelect />

      <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'scan' ? 'bg-brand text-brand-fg' : 'text-muted'
          }`}
          onClick={() => setMode('scan')}
        >
          Scan bill
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-brand text-brand-fg' : 'text-muted'
          }`}
          onClick={() => setMode('manual')}
        >
          Enter manually
        </button>
      </div>

      {mode === 'scan' ? (
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null
              onFilePicked(picked)
              if (picked) void uploadAndParse(picked)
              e.target.value = ''
            }}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => cameraInputRef.current?.click()}
              className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
            >
              <Camera size={18} aria-hidden />
              Take photo
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => libraryInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium text-content"
            >
              <ImagePlus size={18} aria-hidden />
              Choose file
            </button>
          </div>

          {file && (
            <p className="text-sm text-muted">
              Selected: <span className="text-content">{file.name}</span>
            </p>
          )}

          <p className="text-xs text-faint">
            <strong className="text-muted">Tip:</strong> Use Take photo for iPhone bills — library photos are often HEIC and harder to read.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving || !file} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Reading invoice…' : 'Upload & parse'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Service date</span>
            <input
              type="date"
              required
              className="field mt-1"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-muted">Mileage</span>
              <input
                inputMode="numeric"
                className="field mt-1"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Total ($)</span>
              <input
                inputMode="decimal"
                className="field mt-1"
                value={totalDollars}
                onChange={(e) => setTotalDollars(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-muted">Shop name</span>
            <input className="field mt-1" value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Invoice #</span>
            <input
              className="field mt-1"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Your notes (for next visit)</span>
            <textarea
              rows={2}
              className="field mt-1"
              placeholder="e.g. They pushed a transmission flush again"
              value={advisorNotes}
              onChange={(e) => setAdvisorNotes(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted">Invoice photo or PDF (optional)</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="mt-1 w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-medium file:text-content"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="font-semibold">Line items</legend>
            {lines.map((line, index) => (
              <div key={index} className="card space-y-2 p-3">
                <input
                  placeholder="Description"
                  required={index === 0}
                  className="field"
                  value={line.description}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="field text-sm"
                    value={line.category}
                    onChange={(e) => updateLine(index, { category: e.target.value as ServiceCategory })}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k} className="bg-surface text-content">
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="field text-sm"
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
                  className="field"
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
              className="text-sm font-medium text-brand"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              + Add line item
            </button>
          </fieldset>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Save visit'}
          </button>
        </form>
      )}
    </div>
  )
}
