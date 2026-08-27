import { jsPDF } from 'jspdf'
import { fabric } from 'fabric'

function renderPageToDataURL(json: string): Promise<string> {
  return new Promise((resolve) => {
    const el = document.createElement('canvas')
    el.width = 794
    el.height = 1123
    const fc = new fabric.StaticCanvas(el, {
      width: 794,
      height: 1123,
      backgroundColor: '#ffffff',
    })
    if (!json) {
      resolve(fc.toDataURL({ format: 'png', multiplier: 2 }))
      fc.dispose()
      return
    }
    fc.loadFromJSON(JSON.parse(json), () => {
      const dataUrl = fc.toDataURL({ format: 'png', multiplier: 2 })
      fc.dispose()
      resolve(dataUrl)
    })
  })
}

export async function generatePDFBlob(
  pages: string[],
  currentPageIndex: number,
  getCurrentJSON: () => string
): Promise<Blob> {
  const all = [...pages]
  all[currentPageIndex] = getCurrentJSON()

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  for (let i = 0; i < all.length; i++) {
    if (i > 0) pdf.addPage('a4', 'portrait')
    const dataUrl = await renderPageToDataURL(all[i])
    pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297)
  }
  return pdf.output('blob')
}

export async function downloadPDF(blob: Blob, filename = 'stickers.pdf') {
  // File System Access API — kullanıcı nereye kaydedeceğini seçer
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'PDF Dosyası', accept: { 'application/pdf': ['.pdf'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (e) {
      // Kullanıcı iptal etti
      if ((e as Error).name === 'AbortError') return
    }
  }
  // Fallback: tarayıcı otomatik indir
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareViaWebShare(blob: Blob) {
  const file = new File([blob], 'stickers.pdf', { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Sticker Sayfası' })
  } else {
    // Masaüstünde WhatsApp Web — dosya paylaşımı desteklenmiyor, link aç
    window.open('https://web.whatsapp.com', '_blank')
  }
}
