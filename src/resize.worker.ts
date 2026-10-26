// Verkleinert Fotos abseits des Hauptthreads: ein Original rein, mehrere JPEG-Grössen raus.
type Req = { id: number; blob: Blob; sizes: { maxEdge: number; q: number }[] }
const ctx = self as unknown as { onmessage: ((e: MessageEvent<Req>) => void) | null; postMessage: (m: unknown, t?: Transferable[]) => void }

ctx.onmessage = async (e) => {
  const { id, blob, sizes } = e.data
  try {
    const bmp = await createImageBitmap(blob)
    const bufs: ArrayBuffer[] = []
    for (const { maxEdge, q } of sizes) {
      const s = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
      const c = new OffscreenCanvas(Math.round(bmp.width * s), Math.round(bmp.height * s))
      const g = c.getContext('2d')!
      g.imageSmoothingQuality = 'high'
      g.drawImage(bmp, 0, 0, c.width, c.height)
      bufs.push(await (await c.convertToBlob({ type: 'image/jpeg', quality: q })).arrayBuffer())
    }
    bmp.close()
    ctx.postMessage({ id, bufs }, bufs)
  } catch (err) {
    ctx.postMessage({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
