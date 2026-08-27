import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import type { Sticker } from '../types'

const CARD = 88

interface StickerCardProps {
  sticker: Sticker
  index: number
  onDoubleClick: (url: string) => void
}

function StickerCard({ sticker, index, onDoubleClick }: StickerCardProps) {
  const removeSticker = useStore((s) => s.removeSticker)
  const setStickerMode = useStore((s) => s.setStickerMode)
  const displayUrl = sticker.processedUrl ?? sticker.originalUrl

  return (
    <div
      className="relative flex-shrink-0 group cursor-grab active:cursor-grabbing"
      style={{ width: CARD }}
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('imageUrl', displayUrl)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onDoubleClick={() => onDoubleClick(displayUrl)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.04, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        whileHover={{ scale: 1.04, y: -2 }}
        className="w-full"
      >
        {/* Görsel kutusu — × içeride, overflow-hidden yok */}
        <div
          className="relative rounded-xl bg-gray-100 border border-gray-200 shadow-sm"
          style={{ width: CARD, height: CARD }}
        >
          {sticker.processing ? (
            <div className="w-full h-full flex flex-col items-center justify-center rounded-xl gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              {sticker.mode === 'cutout' && (
                <span className="text-[8px] text-gray-400 font-medium text-center px-1 leading-tight">
                  Arka plan<br/>siliniyor...
                </span>
              )}
            </div>
          ) : (
            <img
              src={displayUrl}
              alt={sticker.name}
              className="w-full h-full object-contain p-1.5 rounded-xl"
            />
          )}

          {/* × — resmin içinde sağ üst, overflow sorunu yok */}
          <button
            className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center shadow font-bold leading-none z-10"
            onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id) }}
          >×</button>
        </div>

        <div className="mt-1 flex rounded-md overflow-hidden border border-gray-200 text-[8px] font-semibold">
          <button
            className={`flex-1 py-1 transition-colors ${sticker.mode === 'card' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 bg-white'}`}
            onClick={() => setStickerMode(sticker.id, 'card')}
          >Kart</button>
          <button
            className={`flex-1 py-1 transition-colors ${sticker.mode === 'cutout' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 bg-white'}`}
            onClick={() => setStickerMode(sticker.id, 'cutout')}
          >Kes</button>
        </div>
      </motion.div>
    </div>
  )
}

interface StickerTrayProps {
  onDoubleClick: (url: string) => void
}

export function StickerTray({ onDoubleClick }: StickerTrayProps) {
  const stickers = useStore((s) => s.stickers)
  const reversed = [...stickers].reverse()

  const chunks: typeof stickers[] = []
  for (let i = 0; i < reversed.length; i += 4) {
    chunks.push(reversed.slice(i, i + 4))
  }

  if (stickers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2">
        <p className="text-sm text-gray-300 text-center font-medium">Henüz sticker yok</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto flex-1">
      {chunks.map((chunk, ci) => (
        <div key={ci} className="flex gap-2">
          {chunk.map((s, i) => (
            <StickerCard
              key={s.id}
              sticker={s}
              index={ci * 4 + i}
              onDoubleClick={onDoubleClick}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
