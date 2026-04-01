export async function compressImageFile(
  file: File,
  options?: {
    /** Max width/height in pixels (preserves aspect). */
    maxDimension?: number
    /** 0..1 JPEG/WebP quality. */
    quality?: number
    /** Prefer WebP when available. */
    preferWebp?: boolean
  }
): Promise<File> {
  const maxDimension = options?.maxDimension ?? 1600
  const quality = options?.quality ?? 0.8
  const preferWebp = options?.preferWebp ?? true

  if (typeof window === 'undefined') return file
  if (!file.type.startsWith('image/')) return file

  // If already small, skip (fast path).
  if (file.size <= 900 * 1024) return file

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to load image'))
      el.src = objectUrl
    })

    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (!width || !height) return file

    const scale = Math.min(1, maxDimension / Math.max(width, height))
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(img, 0, 0, targetW, targetH)

    const toType = (() => {
      if (!preferWebp) return 'image/jpeg'
      const canWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
      return canWebp ? 'image/webp' : 'image/jpeg'
    })()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, toType, quality)
    )
    if (!blob) return file

    // If compression doesn't help, keep original.
    if (blob.size >= file.size) return file

    const ext = toType === 'image/webp' ? 'webp' : 'jpg'
    const base = file.name.replace(/\.[^/.]+$/, '')
    const nextName = `${base}.${ext}`
    return new File([blob], nextName, { type: toType, lastModified: Date.now() })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

