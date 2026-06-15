import { useEffect, useState } from 'react'
import { FileText, X } from 'lucide-react'
import type { Attachment } from '../types'
import { getAttachmentSignedUrl } from '../hooks/useVisits'

interface PagePreview {
  attachment: Attachment
  url: string | null
}

export function InvoicePagesGallery({
  attachments,
  onRemove,
  removingId,
}: {
  attachments: Attachment[]
  onRemove?: (attachment: Attachment) => void
  removingId?: string | null
}) {
  const [pages, setPages] = useState<PagePreview[]>([])

  useEffect(() => {
    let cancelled = false
    const sorted = [...attachments].sort(
      (a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime(),
    )

    void Promise.all(
      sorted.map(async (attachment) => ({
        attachment,
        url: await getAttachmentSignedUrl(attachment.storage_path),
      })),
    ).then((loaded) => {
      if (!cancelled) setPages(loaded)
    })

    return () => {
      cancelled = true
    }
  }, [attachments])

  if (!pages.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-faint">
        Invoice pages ({pages.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pages.map(({ attachment, url }, index) => {
          const isPdf = attachment.mime_type === 'application/pdf'
          const isHeic =
            attachment.mime_type?.includes('heic') ||
            attachment.mime_type?.includes('heif') ||
            attachment.storage_path.toLowerCase().endsWith('.heic')

          return (
            <div key={attachment.id} className="relative w-28 shrink-0">
              {url && !isPdf && !isHeic ? (
                <a href={url} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={url}
                    alt={`Invoice page ${index + 1}`}
                    className="h-36 w-28 rounded-xl border border-line bg-surface object-cover"
                  />
                </a>
              ) : (
                <a
                  href={url ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="card flex h-36 w-28 flex-col items-center justify-center gap-1 px-2 text-center text-xs text-muted"
                >
                  <FileText size={20} aria-hidden />
                  {isPdf ? 'PDF' : 'Photo'}
                </a>
              )}
              <span className="mt-1 block text-center text-[10px] text-faint">Page {index + 1}</span>
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove page ${index + 1}`}
                  disabled={removingId === attachment.id}
                  onClick={() => onRemove(attachment)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-danger shadow-sm"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
