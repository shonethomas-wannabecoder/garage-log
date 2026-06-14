import heic2any from 'heic2any'

const MAX_EDGE_PX = 2048
const MAX_FILE_BYTES = 3_500_000
const JPEG_QUALITY = 0.88

export class InvoiceFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvoiceFileError'
  }
}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function isRasterImage(file: File): boolean {
  if (file.type.startsWith('image/') && !isHeic(file)) return true
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name)
}

async function convertViaHeic2Any(file: File): Promise<File> {
  const blob = new Blob([await file.arrayBuffer()], {
    type: file.type || 'image/heic',
  })
  const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.9 })
  const out = Array.isArray(converted) ? converted[0] : converted
  const base = file.name.replace(/\.heic$/i, '').replace(/\.heif$/i, '') || 'invoice'
  return new File([out], `${base}.jpg`, { type: 'image/jpeg' })
}

/** Safari on iPhone can decode HEIC via createImageBitmap even when heic2any fails. */
async function convertViaCanvas(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG export failed'))), 'image/jpeg', 0.9)
  })
  const base = file.name.replace(/\.heic$/i, '').replace(/\.heif$/i, '') || 'invoice'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

/** Shrink large phone photos so the parser is faster and stays under API limits. */
async function compressRasterImage(file: File): Promise<File> {
  if (isPdf(file) || !isRasterImage(file)) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bitmap
  const needsResize = width > MAX_EDGE_PX || height > MAX_EDGE_PX || file.size > MAX_FILE_BYTES
  if (!needsResize) {
    bitmap.close?.()
    return file
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('JPEG export failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
  const base = file.name.replace(/\.[^.]+$/, '') || 'invoice'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

/** Convert iPhone HEIC to JPEG and compress before upload. */
export async function prepareInvoiceFile(file: File): Promise<File> {
  let prepared = file

  if (isHeic(file)) {
    const errors: string[] = []
    try {
      prepared = await convertViaHeic2Any(file)
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'heic2any failed')
      try {
        prepared = await convertViaCanvas(file)
      } catch (e2) {
        errors.push(e2 instanceof Error ? e2.message : 'canvas failed')
        throw new InvoiceFileError(
          'This iPhone photo (HEIC) could not be converted. Tap Take photo to snap the bill with the camera, or use Enter manually.',
        )
      }
    }
  } else if (!file.type && file.name.toLowerCase().endsWith('.jpg')) {
    prepared = new File([file], file.name, { type: 'image/jpeg' })
  }

  return compressRasterImage(prepared)
}

export { isHeic }
