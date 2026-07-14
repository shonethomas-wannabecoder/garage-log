import { useEffect, useState } from 'react'
import { CloudOff, Upload } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import {
  createPendingVisitWithFiles,
  invokeParseInvoice,
} from '../hooks/useVisits'
import {
  dataUrlToFile,
  listOfflineQueue,
  removeOfflineQueueItem,
  type OfflineQueueItem,
} from '../lib/offlineQueue'

export function OfflineQueueBanner() {
  const { selectedVehicleId, household } = useHousehold()
  const [items, setItems] = useState<OfflineQueueItem[]>([])
  const [flushing, setFlushing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setItems(listOfflineQueue())
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('online', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('online', sync)
    }
  }, [])

  if (!items.length) return null

  async function flush() {
    if (!navigator.onLine) {
      setMessage('Still offline — try again when you have a connection.')
      return
    }
    setFlushing(true)
    setMessage(null)
    for (const item of [...items]) {
      try {
        const files = await Promise.all(item.files.map(dataUrlToFile))
        const vehicleId = item.vehicleId || selectedVehicleId
        const householdId = item.householdId || household?.id
        if (!vehicleId || !householdId) continue
        const created = await createPendingVisitWithFiles(vehicleId, files, householdId)
        if (!created.error && created.visitId) {
          await invokeParseInvoice(created.visitId)
          removeOfflineQueueItem(item.id)
        }
      } catch {
        // keep item for retry
      }
    }
    setItems(listOfflineQueue())
    setFlushing(false)
    setMessage('Queued uploads processed.')
  }

  return (
    <section className="rounded-2xl border border-warn/40 bg-warn-soft p-4">
      <div className="flex items-center gap-2 text-on-warn-soft">
        <CloudOff size={16} aria-hidden />
        <h2 className="text-sm font-semibold">
          {items.length} bill{items.length === 1 ? '' : 's'} waiting to upload
        </h2>
      </div>
      <p className="mt-1 text-sm text-on-warn-soft/90">
        Saved locally while offline. Upload when you’re back online.
      </p>
      <button
        type="button"
        disabled={flushing}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-content/10 px-3 py-2 text-sm font-medium text-on-warn-soft"
        onClick={() => void flush()}
      >
        <Upload size={14} aria-hidden />
        {flushing ? 'Uploading…' : 'Upload now'}
      </button>
      {message && <p className="mt-2 text-xs text-on-warn-soft">{message}</p>}
    </section>
  )
}
