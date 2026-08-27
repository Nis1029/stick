/// <reference lib="webworker" />

const MAX_PX = 1024

// Görseli OffscreenCanvas ile küçült — büyük fotoğraflar çok yavaşlatıyor
async function resizeBlob(url: string): Promise<Blob> {
  const res = await fetch(url)
  const blob = await res.blob()
  const bmp = await createImageBitmap(blob)
  const scale = Math.min(1, MAX_PX / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
}

self.onmessage = async (e: MessageEvent<{ id: string; url: string }>) => {
  const { id, url } = e.data
  try {
    const { removeBackground } = await import('@imgly/background-removal')

    const resized = await resizeBlob(url)
    const resizedUrl = URL.createObjectURL(resized)

    const result = await removeBackground(resizedUrl, {
      output: { format: 'image/png', quality: 1 },
    })

    URL.revokeObjectURL(resizedUrl)

    const buffer = await result.arrayBuffer()
    self.postMessage({ id, ok: true, buffer }, { transfer: [buffer] })
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err) })
  }
}
