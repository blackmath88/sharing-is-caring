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

export async function exportImage(id: string, maxEdge: number): Promise<Uint8Array> {
  const f = await get<Blob>('o:' + id, store)
  if (!f) throw new Error('Foto fehlt im Browser-Speicher. Bitte erneut importieren.')
  const bmp = await createImageBitmap(f)
  try {
    return new Uint8Array(await (await resize(bmp, maxEdge, 0.86)).arrayBuffer())
  } finally {
    bmp.close()
  }
}

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

export async function wipe() {
  for (const p of urls.values()) p.then((u) => u && URL.revokeObjectURL(u))
  urls.clear()
  await clear(store)
}
