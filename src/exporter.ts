import { strToU8, zip, type Zippable } from 'fflate'
import { exportImage } from './db'
import { buildEml } from './eml'
import { buildHtml, copyUrl, postCard } from './html'
import { getRecipients, type Data, type Recipient } from './store'
import { fill, varsFor } from './templates'

export const slug = (s: string) =>
  s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'x'

// grobe Schätzung pro Mail (JPEG ~0.75 MB bei 2000px, +37% Base64)
export const estimateMB = (n: number, maxEdge: number) => n * 0.75 * (maxEdge / 2000) ** 2 * 1.37

const THUMB = 560 // Vorschau in der HTML-Mail (lange Kante)
type Imgs = Map<string, { full: Uint8Array; thumb: Uint8Array }>

async function loadImages(ids: string[], maxEdge: number, onProgress?: (f: number, label: string) => void) {
  const imgs: Imgs = new Map()
  for (let i = 0; i < ids.length; i++) {
    onProgress?.((i / ids.length) * 0.85, `Bilder verkleinern: ${i + 1} von ${ids.length}`)
    imgs.set(ids[i], { full: await exportImage(ids[i], maxEdge), thumb: await exportImage(ids[i], THUMB, 0.72) })
  }
  return imgs
}

// Eine Mail: .eml (Text + HTML-Karte + Vorschaubilder + Anhänge), LinkedIn-Text, Anhänge
function buildMail(d: Data, { person: p, photoIds }: Recipient, imgs: Imgs) {
  const ev = slug(d.settings.event)
  const atts = photoIds.map((id, k) => ({
    name: `${ev}_${slug(p.first || p.last)}_${String(k + 1).padStart(2, '0')}.jpg`,
    data: imgs.get(id)!.full,
  }))
  const inline = photoIds.map((id, k) => ({ cid: `foto${k + 1}@sharingiscaring`, data: imgs.get(id)!.thumb }))
  const v = varsFor(p, atts.length, d.settings, d.tpl.post)
  const card = postCard({
    name: v.name, first: p.first, last: p.last, post: v.post, copyHref: copyUrl(v.post),
    images: inline.map((i) => ({ cid: i.cid })),
  })
  const { post: _omit, ...textVars } = v
  const eml = buildEml({
    from: d.settings.senderEmail ? { name: d.settings.senderName, email: d.settings.senderEmail } : undefined,
    to: { name: v.name, email: p.email },
    subject: fill(d.tpl.subject, v),
    body: fill(d.tpl.body, v),
    html: buildHtml(fill(d.tpl.body, textVars), card),
    inline,
    attachments: atts,
  })
  return { eml, post: v.post, atts, name: v.name }
}

// Einzelne Mail für „Mail öffnen“ auf der Export-Seite
export async function buildOne(d: Data, personId: string) {
  const r = getRecipients(d).find((x) => x.person.id === personId)
  if (!r) throw new Error('Person hat keine Fotos.')
  const m = buildMail(d, r, await loadImages(r.photoIds, d.settings.maxEdge))
  return { blob: new Blob([m.eml], { type: 'message/rfc822' }), name: `Mail_${slug(m.name)}.eml` }
}

export async function buildZip(d: Data, onProgress: (f: number, label: string) => void) {
  const recips = getRecipients(d).filter((r) => !d.excluded.includes(r.person.id))
  const ids = [...new Set(recips.flatMap((r) => r.photoIds))]
  const imgs = await loadImages(ids, d.settings.maxEdge, onProgress)

  const files: Zippable = {}
  const used = new Set<string>()
  const rows = [['Vorname', 'Nachname', 'E-Mail', 'Fotos', 'Ordner']]

  for (const r of recips) {
    const p = r.person
    const base = slug(`${p.last}_${p.first}`)
    let folder = base
    for (let n = 2; used.has(folder); n++) folder = `${base}-${n}`
    used.add(folder)

    const m = buildMail(d, r, imgs)
    files[folder] = {
      [`Mail_${slug(m.name)}.eml`]: strToU8(m.eml),
      'LinkedIn-Post.txt': strToU8(m.post),
      ...Object.fromEntries(m.atts.map((a) => [a.name, [a.data, { level: 0 }]])),
    } as Zippable
    rows.push([p.first, p.last, p.email, String(m.atts.length), folder])
  }

  files['Uebersicht.csv'] = strToU8(
    '\uFEFF' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n'),
  )

  onProgress(0.9, 'ZIP packen')
  const out = await new Promise<Uint8Array>((res, rej) => zip(files, (e, data) => (e ? rej(e) : res(data))))
  onProgress(1, 'Fertig')
  return { blob: new Blob([out as BlobPart], { type: 'application/zip' }), count: recips.length }
}

export function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000)
}
