import { create } from 'zustand'
import type { Sticker, StickerMode } from '../types'
import {
  saveBlob, deleteBlob,
  saveStickers, loadStickers, loadBlob,
  loadProcessedUrl, deleteProcessedUrl,
} from '../utils/db'

interface AppState {
  stickers: Sticker[]
  hydrated: boolean
  hydrate: () => Promise<void>
  addStickers: (files: File[]) => Promise<void>
  updateSticker: (id: string, patch: Partial<Sticker>) => void
  removeSticker: (id: string) => Promise<void>
  setStickerMode: (id: string, mode: StickerMode) => void
}

export const useStore = create<AppState>((set) => ({
  stickers: [],
  hydrated: false,

  hydrate: async () => {
    const saved = await loadStickers()
    const stickers: Sticker[] = []

    for (const s of saved) {
      const originalUrl = await loadBlob(`orig_${s.id}`)
      if (!originalUrl) continue

      // Daha önce işlenmiş data URL'i yükle — yoksa processor işleyecek
      const processedUrl = await loadProcessedUrl(s.id)

      stickers.push({
        id: s.id,
        name: s.name,
        mode: s.mode as StickerMode,
        originalUrl,
        processedUrl,
        processing: false,
      })
    }

    set({ stickers, hydrated: true })
  },

  addStickers: async (files) => {
    const newStickers: Sticker[] = []
    for (const file of files) {
      const id = crypto.randomUUID()
      const blob = new Blob([await file.arrayBuffer()], { type: file.type })
      const originalUrl = await saveBlob(`orig_${id}`, blob)
      newStickers.push({ id, name: file.name, originalUrl, processedUrl: null, mode: 'card', processing: false })
    }
    set((s) => {
      const updated = [...s.stickers, ...newStickers]
      saveStickers(updated)
      return { stickers: updated }
    })
  },

  updateSticker: (id, patch) =>
    set((s) => {
      const updated = s.stickers.map((st) => (st.id === id ? { ...st, ...patch } : st))
      saveStickers(updated)
      return { stickers: updated }
    }),

  removeSticker: async (id) => {
    await deleteBlob(`orig_${id}`)
    await deleteProcessedUrl(id)
    set((s) => {
      const updated = s.stickers.filter((st) => st.id !== id)
      saveStickers(updated)
      return { stickers: updated }
    })
  },

  setStickerMode: (id, mode) => {
    // Mod değişince önceki işlenmiş sonucu sil — yeni mod için yeniden işlenecek
    deleteProcessedUrl(id)
    set((s) => {
      const updated = s.stickers.map((st) =>
        st.id === id ? { ...st, mode, processedUrl: null, processing: false } : st
      )
      saveStickers(updated)
      return { stickers: updated }
    })
  },
}))
