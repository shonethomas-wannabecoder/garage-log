import { type FormEvent, useRef, useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VehicleSelect } from '../components/VehicleSelect'
import { useDemoData } from '../demo/DemoDataProvider'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import {
  createPendingVisitWithFiles,
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
  const demo = useDemoData()
  const [mode, setMode] = useState<Mode>('scan')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [odometer, setOdometer] = useState('')
  const [shopName, setShopName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [totalDollars, setTotalDollars] = useState('')
  const [advisorNotes, setAdvisorNotes] = useState('')
  const [lines, setLines] = useState<LineItemDraft[]>([emptyLine()])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  function addFiles(incoming: FileList | File[] | null) {
    if (!incoming?.length) return
    const next = Array.from(incoming)
    setFiles((prev) => [...prev, ...next].slice(0, 10))
    setError(null)
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadAndParse(uploadFiles: File[]) {
    if (!selectedVehicleId || !household || !uploadFiles.length) return

    setSaving(true)
    setError(null)

    const prepared: File[] = []
    try {
      for (const f of uploadFiles) {
        prepared.push(await prepareInvoiceFile(f))
      }
    } catch (err) {
      setSaving(false)
      setError(
        err instanceof InvoiceFileError
          ? err.message
          : 'Could not read that photo. Tap Take photo, or use Enter manually.',
      )
      return
    }

    const created = await createPendingVisitWithFiles(selectedVehicleId, prepared, household.id)
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
    if (!files.length) {
      setError('Add at least one page of the invoice.')
      return
    }
    await uploadAndParse(files)
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

    let preparedFiles = files
    if (files.length) {
      try {
        preparedFiles = []
        for (const f of files) {
          preparedFiles.push(await prepareInvoiceFile(f))
        }
      } catch (err) {
        setSaving(false)
        setError(
          err instanceof InvoiceFileError
            ? err.message
            : 'Could not read one of the invoice photos.',
        )
        return
      }
    }

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
      preparedFiles,
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

  const demoPageNames = demo?.journeyScreen === 'log' ? demo.logPageNames : []
  const pageCount = files.length || demoPageNames.length

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
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving || files.length >= 10}
              onClick={() => cameraInputRef.current?.click()}
              className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
            >
              <Camera size={18} aria-hidden />
              {pageCount ? 'Add page' : 'Take photo'}
            </button>
            <button
              type="button"
              disabled={saving || files.length >= 10}
              onClick={() => libraryInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium text-content"
            >
              <ImagePlus size={18} aria-hidden />
              Choose files
            </button>
          </div>

          {pageCount > 0 && (
            <ul className="space-y-1.5">
              {(files.length ? files.map((f) => f.name) : demoPageNames).map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className="card flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="truncate text-content">
                    Page {index + 1}: {name}
                  </span>
                  {files.length > 0 && (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-medium text-danger"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-faint">
            <strong className="text-muted">Tip:</strong> Add every page of a multi-page bill (up to 10). Use Take photo for iPhone — library photos are often HEIC.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving || !pageCount} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Reading invoice…' : `Upload & parse${pageCount > 1 ? ` (${pageCount} pages)` : ''}`}
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
            <span className="text-sm text-muted">Invoice pages (optional)</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="mt-1 w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-medium file:text-content"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>

          {files.length > 0 && (
            <p className="text-sm text-muted">{files.length} page{files.length > 1 ? 's' : ''} selected</p>
          )}

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
