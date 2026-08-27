export type StickerMode = 'card' | 'cutout'

export interface Sticker {
  id: string
  name: string
  originalUrl: string   // URL.createObjectURL — orijinal görsel
  processedUrl: string | null  // işlenmiş görsel (beyaz kart veya arka plan silinmiş)
  mode: StickerMode
  processing: boolean
}
