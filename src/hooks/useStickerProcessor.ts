import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { applyCardEffect } from '../utils/processImage'
import { saveProcessedUrl } from '../utils/db'
import { removeBackgroundOffThread } from '../utils/bgRemovalWorker'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function useStickerProcessor() {
  const stickers = useStore((s) => s.stickers)
  const updateSticker = useStore((s) => s.updateSticker)

  useEffect(() => {
    // KART: hızlı, hepsini paralel çalıştır
    stickers
      .filter((s) => s.mode === 'card' && !s.processing && !s.processedUrl)
      .forEach((sticker) => {
        updateSticker(sticker.id, { processing: true })
        applyCardEffect(sticker.originalUrl)
          .then(async (dataUrl) => {
            await saveProcessedUrl(sticker.id, dataUrl)
            updateSticker(sticker.id, { processedUrl: dataUrl, processing: false })
          })
          .catch(() => updateSticker(sticker.id, { processedUrl: sticker.originalUrl, processing: false }))
      })

    // KESİM: Web Worker'da çalışır — UI donmaz
    const cutoutsWaiting = stickers.filter((s) => s.mode === 'cutout' && !s.processing && !s.processedUrl)
    const cutoutRunning = stickers.some((s) => s.mode === 'cutout' && s.processing)

    if (cutoutsWaiting.length > 0 && !cutoutRunning) {
      const sticker = cutoutsWaiting[0]
      updateSticker(sticker.id, { processing: true })

      removeBackgroundOffThread(sticker.id, sticker.originalUrl)
        .then(async (blob) => {
          const dataUrl = await blobToDataUrl(blob)
          await saveProcessedUrl(sticker.id, dataUrl)
          updateSticker(sticker.id, { processedUrl: dataUrl, processing: false })
        })
        .catch(() => updateSticker(sticker.id, { processedUrl: sticker.originalUrl, processing: false }))
    }
  }, [stickers, updateSticker])
}
