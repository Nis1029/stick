type Pending = { resolve: (b: Blob) => void; reject: (e: Error) => void }

let worker: Worker | null = null
const pending = new Map<string, Pending>()

function getWorker(): Worker {
  if (worker) return worker

  worker = new Worker(
    new URL('../workers/bgRemoval.worker.ts', import.meta.url),
    { type: 'module' }
  )

  worker.onmessage = (e: MessageEvent<{ id: string; ok: boolean; buffer?: ArrayBuffer; error?: string }>) => {
    const p = pending.get(e.data.id)
    if (!p) return
    pending.delete(e.data.id)
    if (e.data.ok && e.data.buffer) {
      p.resolve(new Blob([e.data.buffer], { type: 'image/png' }))
    } else {
      p.reject(new Error(e.data.error ?? 'Worker başarısız'))
    }
  }

  worker.onerror = () => {
    pending.forEach((p) => p.reject(new Error('Worker çöktü')))
    pending.clear()
    worker = null
  }

  return worker
}

export function removeBackgroundOffThread(id: string, url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ id, url })
  })
}
