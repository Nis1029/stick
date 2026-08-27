import { useRef, useState } from 'react'
import { useStore } from '../store/useStore'

export function UploadZone() {
  const addStickers = useStore((s) => s.addStickers)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (images.length) addStickers(images)
  }

  return (
    <div
      className={`px-4 py-2 rounded-lg border font-mono text-xs tracking-widest uppercase cursor-pointer transition-all ${
        dragging
          ? 'border-white/80 bg-white/20 text-white'
          : 'border-white/30 text-white/50 hover:border-white/60 hover:text-white/80'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      + Görsel Ekle
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
