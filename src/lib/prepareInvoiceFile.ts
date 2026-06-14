import heic2any from 'heic2any'

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

/** Convert iPhone HEIC to JPEG before upload. */
export async function prepareInvoiceFile(file: File): Promise<File> {
  if (!isHeic(file)) {
    if (!file.type && file.name.toLowerCase().endsWith('.jpg')) {
      return new File([file], file.name, { type: 'image/jpeg' })
    }
    return file
  }

  const errors: string[] = []

  try {
    return await convertViaHeic2Any(file)
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'heic2any failed')
  }

  try {
    return await convertViaCanvas(file)
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'canvas failed')
  }

  throw new InvoiceFileError(
    'This iPhone photo (HEIC) could not be converted. Tap Take photo to snap the bill with the camera, or use Enter manually.',
  )
}

export { isHeic }
