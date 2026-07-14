const QUEUE_KEY = 'garage-log-offline-queue'

export interface OfflineQueueItem {
  id: string
  vehicleId: string
  householdId: string
  /** Base64 data URLs for pending photos */
  files: Array<{ name: string; type: string; dataUrl: string }>
  createdAt: string
}

function readQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as OfflineQueueItem[]
  } catch {
    return []
  }
}

function writeQueue(items: OfflineQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function listOfflineQueue(): OfflineQueueItem[] {
  return readQueue()
}

export async function enqueueOfflineUpload(item: Omit<OfflineQueueItem, 'id' | 'createdAt'>) {
  const queue = readQueue()
  queue.push({
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  writeQueue(queue)
}

export function removeOfflineQueueItem(id: string) {
  writeQueue(readQueue().filter((i) => i.id !== id))
}

export async function fileToDataUrl(file: File): Promise<{ name: string; type: string; dataUrl: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  return { name: file.name, type: file.type || 'image/jpeg', dataUrl }
}

export async function dataUrlToFile(entry: {
  name: string
  type: string
  dataUrl: string
}): Promise<File> {
  const res = await fetch(entry.dataUrl)
  const blob = await res.blob()
  return new File([blob], entry.name, { type: entry.type })
}
