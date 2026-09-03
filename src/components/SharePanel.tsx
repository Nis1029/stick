import { useState, useRef, useEffect } from 'react'
import { generatePDFBlob, shareViaWebShare } from '../utils/exportPDF'

interface SharePanelProps {
  pages: string[]
  currentPage: number
  getCurrentJSON: () => string
}

export function SharePanel({ pages, currentPage, getCurrentJSON }: SharePanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'pdf' | 'whatsapp' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handlePDF() {
    setOpen(false)

    // Kullanıcı gesturesi kaybolmadan önce dosya konumunu seç.
    // showSaveFilePicker desteklenmiyorsa ya da herhangi bir sebeple
    // başarısız olursa (kullanıcı iptal, izin politikası, tarayıcı kısıtlaması vb.)
    // sessizce hiçbir şey yapmadan çıkmak yerine normal indirmeye düşüyoruz —
    // aksi halde kullanıcı hiçbir geri bildirim almadan "hiçbir şey olmuyor" hissine kapılıyor.
    let fileHandle: FileSystemFileHandle | null = null
    if ('showSaveFilePicker' in window) {
      try {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'stickers.pdf',
          types: [{ description: 'PDF Dosyası', accept: { 'application/pdf': ['.pdf'] } }],
        })
      } catch {
        fileHandle = null
      }
    }

    setLoading('pdf')
    try {
      const blob = await generatePDFBlob(pages, currentPage, getCurrentJSON)
      if (fileHandle) {
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'stickers.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleWhatsApp() {
    setOpen(false)
    setLoading('whatsapp')
    try {
      const blob = await generatePDFBlob(pages, currentPage, getCurrentJSON)
      await shareViaWebShare(blob)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading !== null}
        className="h-9 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:scale-95 transition-all shadow-md whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ minWidth: 160 }}
      >
        {loading !== null ? (
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dışa Aktar
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-11 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <button
            onClick={handlePDF}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">PDF İndir</p>
              <p className="text-[11px] text-gray-400 leading-tight">Konum seç</p>
            </div>
          </button>

          <div className="h-px bg-gray-100 mx-3" />

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="2" cy="7" r="1.5" stroke="#374151" strokeWidth="1.5"/>
                <circle cx="12" cy="2" r="1.5" stroke="#374151" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="1.5" stroke="#374151" strokeWidth="1.5"/>
                <path d="M3.5 6.2L10.5 3M3.5 7.8L10.5 11" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Paylaş</p>
              <p className="text-[11px] text-gray-400 leading-tight">PDF olarak gönder</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
