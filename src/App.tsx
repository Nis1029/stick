import { useEffect, useRef, useState } from 'react'
import { useStickerProcessor } from './hooks/useStickerProcessor'
import { StickerTray } from './components/StickerTray'
import { Navbar } from './components/Navbar'
import { CanvasBoard, type CanvasBoardHandle } from './components/CanvasBoard'
import { useStore } from './store/useStore'
import { GradientBackground } from './components/ui/noisy-gradient-backgrounds'
import { saveMeta, loadMeta } from './utils/db'
import { SharePanel } from './components/SharePanel'

const A4_SCALE = 1.56
const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, A4_SCALE]
const A4_IDX = ZOOM_STEPS.length - 1
const DEFAULT_ZOOM = 5

function ZoomBar({ scale, zoomIdx, onZoom }: { scale: number; zoomIdx: number; onZoom: (d: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <button
        onClick={() => onZoom(-1)}
        className="w-7 h-7 flex items-center justify-center bg-gray-900 rounded-lg text-white text-base font-light transition-all shadow-sm active:scale-95 hover:bg-gray-700"
      >−</button>
      <span className="text-[11px] font-semibold text-gray-600 w-8 text-center tabular-nums">
        {zoomIdx === A4_IDX ? 'A4' : `${Math.round(scale * 100)}%`}
      </span>
      <button
        onClick={() => onZoom(+1)}
        className="w-7 h-7 flex items-center justify-center bg-gray-900 rounded-lg text-white text-base font-light transition-all shadow-sm active:scale-95 hover:bg-gray-700"
      >+</button>
    </div>
  )
}

function App() {
  const hydrate = useStore((s) => s.hydrate)
  const hydrated = useStore((s) => s.hydrated)
  const addStickers = useStore((s) => s.addStickers)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<CanvasBoardHandle>(null)
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM)
  const [pages, setPages] = useState<string[]>([''])
  const [currentPage, setCurrentPage] = useState(0)
  useStickerProcessor()


  function saveCurrentAndGet(): string[] {
    const json = canvasRef.current?.getJSON() ?? ''
    const updated = [...pages]
    updated[currentPage] = json
    return updated
  }

  function switchPage(newIndex: number) {
    const updated = saveCurrentAndGet()
    setPages(updated)
    saveMeta('canvasPages', JSON.stringify(updated))
    canvasRef.current?.loadJSON(updated[newIndex] ?? '')
    setCurrentPage(newIndex)
  }

  function addPage() {
    const updated = saveCurrentAndGet()
    updated.push('')
    setPages(updated)
    saveMeta('canvasPages', JSON.stringify(updated))
    canvasRef.current?.loadJSON('')
    setCurrentPage(updated.length - 1)
  }

  function deletePage(index: number) {
    if (pages.length === 1) return
    const updated = saveCurrentAndGet().filter((_, i) => i !== index)
    const newIndex = Math.min(index, updated.length - 1)
    setPages(updated)
    saveMeta('canvasPages', JSON.stringify(updated))
    canvasRef.current?.loadJSON(updated[newIndex] ?? '')
    setCurrentPage(newIndex)
  }

  // Sayfa kapanmadan / sekme değişince mevcut canvas'ı kaydet
  useEffect(() => {
    const save = () => {
      const json = canvasRef.current?.getJSON() ?? ''
      const updated = [...pages]
      updated[currentPage] = json
      saveMeta('canvasPages', JSON.stringify(updated))
    }
    window.addEventListener('blur', save)
    window.addEventListener('beforeunload', save)
    // Her 15 saniyede otomatik kayıt
    const interval = setInterval(save, 15000)
    return () => {
      window.removeEventListener('blur', save)
      window.removeEventListener('beforeunload', save)
      clearInterval(interval)
    }
  }, [pages, currentPage])

  useEffect(() => { hydrate() }, [hydrate])

  // Sayfa yüklenince canvas sayfalarını geri yükle
  useEffect(() => {
    loadMeta('canvasPages').then((raw) => {
      if (!raw) return
      try {
        const saved: string[] = JSON.parse(raw)
        if (saved.length > 0) {
          setPages(saved)
          setCurrentPage(0)
          // Canvas henüz mount olmamış olabilir, kısa bekle
          setTimeout(() => {
            canvasRef.current?.loadJSON(saved[0] ?? '')
          }, 100)
        }
      } catch { /* bozuk veri */ }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    if (files.length) addStickers(files)
    e.target.value = ''
  }

  function handleZoom(dir: number) {
    setZoomIdx(i => Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + dir)))
  }

  const scale = ZOOM_STEPS[zoomIdx]
  const scaledW = 794 * scale
  const scaledH = 1123 * scale

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <GradientBackground
          noiseIntensity={1.4}
          noisePatternAlpha={70}
          noisePatternRefreshInterval={0}
        />
        <div className="relative z-10 w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      {/* Tüm ekranı kaplayan gradient — navbar dahil */}
      <GradientBackground
        gradientOrigin="bottom-middle"
        gradientSize="125% 125%"
        colors={[
          { color: 'rgba(252,170,115,1)', stop: '10.5%' },
          { color: 'rgba(252,183,135,1)', stop: '16%'   },
          { color: 'rgba(252,193,148,1)', stop: '17.5%' },
          { color: 'rgba(252,208,175,1)', stop: '25%'   },
          { color: 'rgba(245,198,220,1)', stop: '40%'   },
          { color: 'rgba(220,200,235,1)', stop: '65%'   },
          { color: 'rgba(185,215,242,1)', stop: '100%'  },
        ]}
        enableNoise={false}
      />

      {/* İçerik — gradient'in üstünde */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <Navbar right={
          <div className="flex items-center gap-3">
            <ZoomBar scale={scale} zoomIdx={zoomIdx} onZoom={handleZoom} />
            <SharePanel
              pages={pages}
              currentPage={currentPage}
              getCurrentJSON={() => canvasRef.current?.getJSON() ?? ''}
            />
          </div>
        } />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sol panel — cam efekti */}
          <aside className="w-[400px] bg-white/30 backdrop-blur-md border-r border-white/30 flex flex-col px-3 py-4 gap-3 min-h-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 border-[3px] border-dashed border-white/70 rounded-2xl py-7 text-base font-bold text-gray-800 hover:border-white/80 hover:bg-white/20 transition-all active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Görsel Ekle
            </button>
            <div className="w-full h-[0.5px] bg-white/30 rounded-full" />
            <StickerTray onDoubleClick={(url) => canvasRef.current?.addImage(url)} />
          </aside>

          {/* Canvas alanı */}
          <main className="flex-1 flex flex-col relative min-w-0">
            <div className="flex-1 overflow-auto">
              <div
                className="flex items-start justify-center"
                style={{ minWidth: scaledW + 80, minHeight: scaledH + 40, paddingTop: 12, paddingBottom: 40, paddingLeft: 40, paddingRight: 40 }}
              >
                <CanvasBoard ref={canvasRef} scale={scale} />
              </div>
            </div>

            {/* Sağ alt — sayfalar yatay */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              {pages.map((_, i) => (
                <div key={i} className="relative group">
                  <button
                    onClick={() => switchPage(i)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      i === currentPage
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white/60 backdrop-blur-sm text-gray-600 hover:bg-white/80'
                    }`}
                  >
                    {i + 1}
                  </button>
                  {pages.length > 1 && (
                    <button
                      onClick={() => deletePage(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-400 text-white rounded-full text-[9px] hidden group-hover:flex items-center justify-center leading-none"
                    >×</button>
                  )}
                </div>
              ))}

              <button
                onClick={addPage}
                className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 text-gray-500 hover:bg-white/80 text-xl font-light transition-all shadow-sm"
              >+</button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
