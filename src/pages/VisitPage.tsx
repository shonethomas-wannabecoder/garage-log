import { useRef, useState } from 'react'
import { Camera, FileText, ImagePlus } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { InvoicePagesGallery } from '../components/InvoicePagesGallery'
import { CategoryChip } from '../components/ui'
import { useHousehold } from '../contexts/HouseholdContext'
import { addVisitAttachments, deleteVisitAttachment, useVisitDetail } from '../hooks/useVisits'
import { InvoiceFileError, prepareInvoiceFile } from '../lib/prepareInvoiceFile'
import { formatDate, formatMileage, formatMoney } from '../lib/format'
import type { Attachment } from '../types'

const MAX_PAGES = 10

export function VisitPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const { household } = useHousehold()
  const { visit, lineItems, attachments, loading, error, refresh } = useVisitDetail(visitId)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  async function handleAddPages(fileList: FileList | null) {
    if (!fileList?.length || !visitId || !household) return

    const remaining = MAX_PAGES - attachments.length
    if (remaining <= 0) {
      setUploadError(`You can attach up to ${MAX_PAGES} pages per visit.`)
      return
    }

    const incoming = Array.from(fileList).slice(0, remaining)
    setUploading(true)
    setUploadError(null)

    try {
      const prepared: File[] = []
      for (const f of incoming) {
        prepared.push(await prepareInvoiceFile(f))
      }
      const added = await addVisitAttachments(visitId, household.id, prepared, false)
      if (added.error) {
        setUploadError(added.error)
      } else {
        await refresh()
      }
    } catch (err) {
      setUploadError(
        err instanceof InvoiceFileError
          ? err.message
          : 'Could not read one of the invoice photos.',
      )
    } finally {
      setUploading(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (libraryInputRef.current) libraryInputRef.current.value = ''
    }
  }

  async function handleRemovePage(attachment: Attachment) {
    if (!visitId || !confirm('Remove this invoice page?')) return
    setRemovingId(attachment.id)
    setUploadError(null)
    const result = await deleteVisitAttachment(attachment.id, attachment.storage_path)
    await refresh()
    setRemovingId(null)
    if (result.error) setUploadError(result.error)
  }

  if (loading) return <p className="text-muted">Loading…</p>
  if (error || !visit) return <p className="text-danger">{error ?? 'Visit not found'}</p>

  if (visit.parse_status !== 'confirmed') {
    return <Navigate to={`/visits/${visitId}/review`} replace />
  }

  const atPageLimit = attachments.length >= MAX_PAGES

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{formatDate(visit.service_date)}</h1>
        <p className="mt-0.5 text-muted">{visit.shop_name ?? 'Unknown shop'}</p>
        <p className="mt-1 text-sm text-faint">
          {formatMileage(visit.odometer)} · {formatMoney(visit.total_cents, visit.currency)}
        </p>
        {visit.invoice_number && (
          <p className="text-sm text-faint">Invoice #{visit.invoice_number}</p>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Invoice</h2>
          {!atPageLimit && (
            <span className="text-xs text-faint">
              {attachments.length ? `${attachments.length}/${MAX_PAGES} pages` : 'No pages yet'}
            </span>
          )}
        </div>

        {attachments.length > 0 ? (
          <InvoicePagesGallery
            attachments={attachments}
            onRemove={handleRemovePage}
            removingId={removingId}
          />
        ) : (
          <p className="card px-4 py-3 text-sm text-muted">
            No invoice photos yet. Add pages below to keep a copy with this visit.
          </p>
        )}

        {attachments.some((a) => a.mime_type === 'application/pdf') && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <FileText size={16} aria-hidden />
            Tap a PDF page above to open it.
          </p>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void handleAddPages(e.target.files)}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => void handleAddPages(e.target.files)}
        />

        {!atPageLimit && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
              className="btn-primary flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
            >
              <Camera size={18} aria-hidden />
              {attachments.length ? 'Add page' : 'Take photo'}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => libraryInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium text-content disabled:opacity-50"
            >
              <ImagePlus size={18} aria-hidden />
              Choose files
            </button>
          </div>
        )}

        {uploading && (
          <p className="text-sm text-muted">Uploading…</p>
        )}
        {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
        {!atPageLimit && (
          <p className="text-xs text-faint">
            Add missing invoice pages anytime — your saved line items won&apos;t change.
          </p>
        )}
      </section>

      {visit.advisor_notes && (
        <blockquote className="rounded-2xl border-l-4 border-brand bg-surface p-3 text-sm italic text-muted">
          {visit.advisor_notes}
        </blockquote>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">Work performed</h2>
        <ul className="space-y-2">
          {lineItems.map((item) => (
            <li key={item.id} className="card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{item.description}</p>
                {item.line_total_cents != null && (
                  <p className="shrink-0 text-sm text-muted">{formatMoney(item.line_total_cents)}</p>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <CategoryChip category={item.category} />
                <span className="text-xs capitalize text-faint">{item.item_type}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
