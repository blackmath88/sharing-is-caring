import { createStore, get, set, clear } from 'idb-keyval'
import { useEffect, useState } from 'react'

// o: Original, v: Ansicht (1600px), t: Thumbnail (320px)
const store = createStore('fotodank', 'blobs')
const urls = new Map<string, Promise<string | null>>()

async function resize(bmp: ImageBitmap, maxEdge: number, q: number): Promise<Blob> {
  const s = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s)
  c.height = Math.round(bmp.height * s)
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error('toBlob'))), 'image/jpeg', q))
}

export async function ingest(file: File, id: string) {
  const bmp = await createImageBitmap(file) // wirft bei HEIC & Co.
  try {
    await set('o:' + id, file, store)
    await set('v:' + id, await resize(bmp, 1600, 0.85), store)
    await set('t:' + id, await resize(bmp, 320, 0.75), store)
    return { w: bmp.width, h: bmp.height }
  } finally {
    bmp.close()
  }
}

export const hasOriginal = async (id: string) => !!(await get('o:' + id, store))

export type Size = { maxEdge: number; q: number }

// Worker-Pool fürs Verkleinern beim Export, damit die Oberfläche nicht einfriert.
// Ohne OffscreenCanvas (alte Browser) läuft es wie bisher im Hauptthread.
export const POOL = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2))
const canWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
const workers: Worker[] = []
const pending = new Map<number, { res: (b: Uint8Array[]) => void; rej: (e: Error) => void }>()
let seq = 0

function worker(slot: number) {
  const i = slot % POOL
  if (!workers[i]) {
    const w = new Worker(new URL('./resize.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<{ id: number; bufs?: ArrayBuffer[]; error?: string }>) => {
      const job = pending.get(e.data.id)
      if (!job) return
      pending.delete(e.data.id)
      if (e.data.bufs) job.res(e.data.bufs.map((b) => new Uint8Array(b)))
      else job.rej(new Error(e.data.error ?? 'Worker'))
    }
    workers[i] = w
  }
  return workers[i]
}

export async function exportImages(id: string, sizes: Size[], slot = 0): Promise<Uint8Array[]> {
  const f = await get<Blob>('o:' + id, store)
  if (!f) throw new Error('Foto fehlt im Browser-Speicher. Bitte erneut importieren.')
  if (canWorker) {
    return new Promise((res, rej) => {
      const n = ++seq
      pending.set(n, { res, rej })
      worker(slot).postMessage({ id: n, blob: f, sizes })
    })
  }
  const bmp = await createImageBitmap(f)
  try {
    const out: Uint8Array[] = []
    for (const s of sizes) out.push(new Uint8Array(await (await resize(bmp, s.maxEdge, s.q)).arrayBuffer()))
    return out
  } finally {
    bmp.close()
  }
}

export const exportImage = async (id: string, maxEdge: number, q = 0.86) => (await exportImages(id, [{ maxEdge, q }]))[0]

function blobUrl(key: string) {
  if (!urls.has(key)) urls.set(key, get<Blob>(key, store).then((b) => (b ? URL.createObjectURL(b) : null)))
  return urls.get(key)!
}

export function useImage(kind: 't' | 'v', id?: string) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    let on = true
    blobUrl(kind + ':' + id).then((u) => on && setUrl(u))
    return () => { on = false }
  }, [kind, id])
  return url
}

export const prefetch = (id?: string) => id && blobUrl('v:' + id)

// Mehrere Bilder auf einmal, z. B. für die Mail-Vorschau
export function useImages(kind: 't' | 'v', ids: string[]) {
  const [urls, setUrls] = useState<string[]>([])
  const key = ids.join('|')
  useEffect(() => {
    let on = true
    Promise.all(ids.map((id) => blobUrl(kind + ':' + id))).then((u) => on && setUrls(u.filter((x): x is string => !!x)))
    return () => { on = false }
  }, [kind, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return urls
}

export async function wipe() {
  for (const p of urls.values()) p.then((u) => u && URL.revokeObjectURL(u))
  urls.clear()
  await clear(store)
}
