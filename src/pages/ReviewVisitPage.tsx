import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Camera, ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { InvoicePagesGallery } from '../components/InvoicePagesGallery'
import { VisitVehiclePicker, vehicleLabel } from '../components/VisitVehiclePicker'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import {
  addVisitAttachments,
  confirmVisit,
  deleteVisitAttachment,
  discardPendingVisit,
  invokeParseInvoice,
  moveVisitToVehicle,
  replaceVisitAttachment,
  useVisitDetail,
} from '../hooks/useVisits'
import { InvoiceFileError, prepareInvoiceFile } from '../lib/prepareInvoiceFile'
import { lineItemsFromParse } from '../lib/parse'
import type { Attachment, LineItem, LineItemDraft, LineItemType, ServiceCategory, ServiceVisit } from '../types'
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

function applyVisitToForm(visit: ServiceVisit, lineItems: LineItem[]) {
  const lines =
    lineItems.length > 0
      ? lineItems.map((l) => ({
          description: l.description,
          category: l.category,
          item_type: l.item_type,
          quantity: l.quantity,
          unit_price_cents: l.unit_price_cents,
          line_total_cents: l.line_total_cents,
        }))
      : lineItemsFromParse(visit.raw_parse_json)

  return {
    serviceDate: visit.service_date,
    odometer: visit.odometer?.toString() ?? '',
    shopName: visit.shop_name ?? '',
    invoiceNumber: visit.invoice_number ?? '',
    totalDollars: visit.total_cents != null ? (visit.total_cents / 100).toFixed(2) : '',
    advisorNotes:
      visit.advisor_notes?.trim() ||
      visit.raw_parse_json?.advisor_notes?.trim() ||
      '',
    lines,
  }
}

function hasParsedContent(visit: ServiceVisit, lines: LineItemDraft[]): boolean {
  if (lines.some((l) => l.description.trim())) return true
  return Boolean(
    visit.shop_name ||
      visit.invoice_number ||
      visit.total_cents ||
      visit.odometer ||
      visit.advisor_notes ||
      visit.raw_parse_json?.advisor_notes,
  )
}

export function ReviewVisitPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { household, vehicles } = useHousehold()
  const { visit, lineItems, attachments, loading, error, refresh } = useVisitDetail(visitId)

  const [serviceDate, setServiceDate] = useState('')
  const [odometer, setOdometer] = useState('')
  const [shopName, setShopName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [totalDollars, setTotalDollars] = useState('')
  const [advisorNotes, setAdvisorNotes] = useState('')
  const [lines, setLines] = useState<LineItemDraft[]>([emptyLine()])
  // Bumped when lines are reset or removed so uncontrolled inputs remount with fresh defaults
  const [lineListVersion, setLineListVersion] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [parseMessage, setParseMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [movingVehicle, setMovingVehicle] = useState(false)
  const autoParseAttempted = useRef(false)
  const addInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  async function handleAddPages(fileList: FileList | null) {
    if (!fileList?.length || !visitId || !household) return
    setParsing(true)
    setParseMessage(null)
    try {
      const prepared: File[] = []
      for (const f of Array.from(fileList)) {
        prepared.push(await prepareInvoiceFile(f))
      }
      const added = await addVisitAttachments(visitId, household.id, prepared)
      if (added.error) {
        setParseMessage(added.error)
        setParsing(false)
        return
      }
      await refresh()
      autoParseAttempted.current = true
      await retryParse()
    } catch (err) {
      setParseMessage(
        err instanceof InvoiceFileError
          ? err.message
          : 'Could not read that photo. Try again or fill in manually.',
      )
      setParsing(false)
    }
    if (addInputRef.current) addInputRef.current.value = ''
  }

  async function handleReplaceAll(fileList: FileList | null) {
    if (!fileList?.[0] || !visitId || !household) return
    setParsing(true)
    setParseMessage(null)
    try {
      const prepared = await prepareInvoiceFile(fileList[0])
      const replaced = await replaceVisitAttachment(visitId, household.id, prepared)
      if (replaced.error) {
        setParseMessage(replaced.error)
        setParsing(false)
        return
      }
      await refresh()
      autoParseAttempted.current = true
      await retryParse()
    } catch (err) {
      setParseMessage(
        err instanceof InvoiceFileError
          ? err.message
          : 'Could not read that photo. Try again or fill in manually.',
      )
      setParsing(false)
    }
    if (replaceInputRef.current) replaceInputRef.current.value = ''
  }

  async function handleRemovePage(attachment: Attachment) {
    if (!visitId || !confirm('Remove this page?')) return
    setRemovingId(attachment.id)
    const result = await deleteVisitAttachment(attachment.id, attachment.storage_path)
    await refresh()
    setRemovingId(null)
    if (result.error) setParseMessage(result.error)
  }

  async function handleVehicleChange(nextId: string) {
    if (!visitId || !visit || nextId === visit.vehicle_id) return
    const nextVehicle = vehicles.find((v) => v.id === nextId)
    if (
      !confirm(
        `Move this visit to ${nextVehicle ? vehicleLabel(nextVehicle) : 'the selected vehicle'}?`,
      )
    ) {
      return
    }

    setMovingVehicle(true)
    setParseMessage(null)
    const result = await moveVisitToVehicle(visitId, nextId)
    await refresh()
    setMovingVehicle(false)
    if (result.error) setParseMessage(result.error)
  }

  const retryParse = useCallback(async () => {
    if (!visitId) return
    setParsing(true)
    setParseMessage(null)
    const result = await invokeParseInvoice(visitId)
    await refresh()
    setParsing(false)
    if (result.error) {
      setParseMessage(result.error)
    } else if (result.lineCount === 0) {
      setParseMessage('Nothing was read from the bill. Try Retry parse or fill in the fields below.')
    }
  }, [visitId, refresh])

  useEffect(() => {
    if (!visit) return
    const form = applyVisitToForm(visit, lineItems)
    setServiceDate(form.serviceDate)
    setOdometer(form.odometer)
    setShopName(form.shopName)
    setInvoiceNumber(form.invoiceNumber)
    setTotalDollars(form.totalDollars)
    setAdvisorNotes(form.advisorNotes)
    setLines(form.lines)
    setLineListVersion((v) => v + 1)
  }, [visit, lineItems])

  useEffect(() => {
    if (!visitId || !visit || visit.parse_status !== 'pending' || parsing || autoParseAttempted.current)
      return
    autoParseAttempted.current = true
    void retryParse()
  }, [visit?.parse_status, visitId, parsing, retryParse, visit])

  function updateLine(index: number, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
    setLineListVersion((v) => v + 1)
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    if (!visitId || !user) return

    const validLines = lines.filter((l) => l.description.trim())
    if (!validLines.length) {
      setSaveError('Add at least one line item.')
      return
    }

    setSaving(true)
    setSaveError(null)

    const total_cents = totalDollars
      ? Math.round(parseFloat(totalDollars) * 100)
      : validLines.reduce((sum, l) => sum + (l.line_total_cents ?? 0), 0) || null

    const result = await confirmVisit(
      visitId,
      {
        service_date: serviceDate,
        odometer: odometer ? parseInt(odometer, 10) : null,
        shop_name: shopName.trim() || null,
        invoice_number: invoiceNumber.trim() || null,
        total_cents,
        advisor_notes: advisorNotes.trim() || null,
      },
      validLines,
      user.id,
    )

    setSaving(false)
    if (result.error) setSaveError(result.error)
    else navigate(`/visits/${visitId}`)
  }

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading invoice">
        <div className="skeleton h-20" />
        <div className="skeleton h-40" />
        <div className="skeleton h-32" />
      </div>
    )
  }
  if (error || !visit) return <p className="text-danger">{error ?? 'Visit not found'}</p>

  if (visit.parse_status === 'confirmed') {
    return (
      <div>
        <p className="text-muted">This visit is already confirmed.</p>
        <Link to={`/visits/${visitId}`} className="mt-2 inline-block font-medium text-brand">
          View visit →
        </Link>
      </div>
    )
  }

  const parseError = visit.raw_parse_json?.parse_error
  const displayError = parseMessage ?? parseError ?? null
  const emptyParse = !parsing && !hasParsedContent(visit, lines)
  const needsNewPhoto =
    Boolean(displayError?.toLowerCase().includes('heic')) ||
    attachments.some(
      (a) =>
        a.mime_type?.includes('heic') ||
        a.mime_type?.includes('heif') ||
        a.storage_path.toLowerCase().endsWith('.heic'),
    )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review invoice"
        subtitle="Check what was read from your bill. Fix anything wrong before saving."
      />

      {parsing && (
        <p className="rounded-xl border border-brand/30 bg-brand-soft p-3 text-sm text-on-brand-soft">
          Reading your invoice…
        </p>
      )}

      {(displayError || emptyParse) && !parsing && (
        <div className="rounded-xl border border-warn/40 bg-warn-soft p-3 text-sm text-on-warn-soft space-y-2">
          {displayError && <p>{displayError}</p>}
          {emptyParse && !displayError && (
            <p>
              Nothing was extracted. Set up the parser in Supabase, or fill in the form below by hand.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <input
              ref={addInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => void handleAddPages(e.target.files)}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => void handleReplaceAll(e.target.files)}
            />
            {!needsNewPhoto && (
              <button
                type="button"
                disabled={parsing || attachments.length >= 10}
                onClick={() => addInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 font-medium text-brand"
              >
                <ImagePlus size={14} aria-hidden />
                Add page
              </button>
            )}
            {needsNewPhoto && (
              <button
                type="button"
                onClick={() => replaceInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 font-medium text-brand"
              >
                <Camera size={14} aria-hidden />
                Replace pages
              </button>
            )}
            {!needsNewPhoto && (
              <button
                type="button"
                onClick={() => void retryParse()}
                className="inline-flex items-center gap-1.5 font-medium text-brand"
              >
                <RefreshCw size={14} aria-hidden />
                Retry parse
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                if (!visitId || !confirm('Discard this upload?')) return
                await discardPendingVisit(visitId)
                navigate('/')
              }}
              className="inline-flex items-center gap-1.5 font-medium text-danger"
            >
              <Trash2 size={14} aria-hidden />
              Discard upload
            </button>
          </div>
        </div>
      )}

      <InvoicePagesGallery
        attachments={attachments}
        onRemove={handleRemovePage}
        removingId={removingId}
      />

      {needsNewPhoto && (
        <p className="card px-4 py-3 text-sm text-muted">
          iPhone photo format (HEIC) can&apos;t be read. Tap <strong className="text-content">Replace pages</strong>{' '}
          to take or pick new pictures — we&apos;ll convert them automatically.
        </p>
      )}

      <form onSubmit={handleConfirm} className="space-y-4">
        <VisitVehiclePicker
          vehicleId={visit.vehicle_id}
          onVehicleChange={handleVehicleChange}
          disabled={movingVehicle || parsing || saving}
        />

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
            value={advisorNotes}
            onChange={(e) => setAdvisorNotes(e.target.value)}
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="font-semibold">Line items</legend>
          {lines.map((line, index) => (
            <div key={`${lineListVersion}-${index}`} className="card space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-faint">
                  Item {index + 1}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-danger"
                    onClick={() => removeLine(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
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
                defaultValue={line.line_total_cents != null ? (line.line_total_cents / 100).toFixed(2) : ''}
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

        {saveError && <p className="text-sm text-danger">{saveError}</p>}

        <button type="submit" disabled={saving || parsing} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Confirm & save'}
        </button>
      </form>
    </div>
  )
}
