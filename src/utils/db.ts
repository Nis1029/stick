import { openDB } from 'idb'
import type { Sticker } from '../types'

const DB_NAME = 'sticker-app'
const DB_VERSION = 3

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('stickers', { keyPath: 'id' })
        db.createObjectStore('blobs')
      }
      if (oldVersion < 2) {
        db.createObjectStore('processedUrls')
      }
      if (oldVersion < 3) {
        // Genel amaçlı key-value store (canvas sayfaları vb.)
        db.createObjectStore('meta')
      }
    },
  })
}

// Orijinal görsel blob'u kaydet
// Not: Blob'u doğrudan IndexedDB'ye yazmıyoruz — Safari (özellikle iOS/iPadOS)
// bunu bazı durumlarda seri hale getiremeyip "Error preparing Blob/File data
// to be stored in object store" hatası veriyor. ArrayBuffer + type olarak
// saklamak tüm tarayıcılarda güvenilir çalışıyor.
export async function saveBlob(id: string, blob: Blob): Promise<string> {
  const db = await getDB()
  const buffer = await blob.arrayBuffer()
  await db.put('blobs', { buffer, type: blob.type }, id)
  return URL.createObjectURL(blob)
}

export async function loadBlob(id: string): Promise<string | null> {
  const db = await getDB()
  const record = await db.get('blobs', id)
  if (!record) return null
  // Eski kayıtlar ham Blob olarak saklanmış olabilir — geriye dönük uyumluluk
  if (record instanceof Blob) return URL.createObjectURL(record)
  return URL.createObjectURL(new Blob([record.buffer], { type: record.type }))
}

export async function deleteBlob(id: string) {
  const db = await getDB()
  await db.delete('blobs', id)
}

// İşlenmiş sonucu data URL string olarak kaydet — kalıcı
export async function saveProcessedUrl(id: string, dataUrl: string): Promise<void> {
  const db = await getDB()
  await db.put('processedUrls', dataUrl, id)
}

export async function loadProcessedUrl(id: string): Promise<string | null> {
  const db = await getDB()
  const url = await db.get('processedUrls', id)
  return url ?? null
}

export async function deleteProcessedUrl(id: string) {
  const db = await getDB()
  await db.delete('processedUrls', id)
}

export async function saveStickers(stickers: Sticker[]) {
  const db = await getDB()
  const tx = db.transaction('stickers', 'readwrite')
  await tx.store.clear()
  for (const s of stickers) {
    await tx.store.put({ id: s.id, name: s.name, mode: s.mode })
  }
  await tx.done
}

export async function loadStickers(): Promise<Array<{ id: string; name: string; mode: string }>> {
  const db = await getDB()
  return db.getAll('stickers')
}

export async function saveMeta(key: string, value: string): Promise<void> {
  const db = await getDB()
  await db.put('meta', value, key)
}

export async function loadMeta(key: string): Promise<string | null> {
  const db = await getDB()
  const val = await db.get('meta', key)
  return val ?? null
}
