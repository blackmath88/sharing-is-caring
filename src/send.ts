// „Senden“ ohne Integration: Share-Sheet mit Fotos, wo es das gibt (Handy, Windows, Safari),
// sonst ein mailto-Entwurf mit Empfänger, Betreff und Text. Beides ohne Konto, ohne Server.
import { exportImages } from './db'
import { attachmentName } from './exporter'
import { copyUrl } from './html'
import type { Data, Recipient } from './store'
import { fill, varsFor } from './templates'

export type MailParts = { to: string; subject: string; text: string }

// Textfassung der Mail plus Link zur Kopierseite, weil Share und mailto kein HTML tragen
export function mailParts(d: Data, { person: p, photoIds }: Recipient, copyHref = ''): MailParts {
  const v = varsFor(p, photoIds.length, d.settings, d.tpl.post)
  const href = copyHref || copyUrl(v.post)
  const body = fill(d.tpl.body, v).trim()
  return { to: p.email, subject: fill(d.tpl.subject, v), text: `${body}\n\nLinkedIn-Text zum Kopieren: ${href}` }
}

// CRLF und encodeURIComponent: so lesen Outlook, Apple Mail und Gmail die Zeilenumbrüche korrekt
export const mailtoUrl = ({ to, subject, text }: MailParts) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.replace(/\r?\n/g, '\r\n'))}`

export const canShareFiles = () => {
  try {
    return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [new File([new Uint8Array(1)], 'x.jpg', { type: 'image/jpeg' })] })
  } catch { return false }
}

export async function shareFiles(d: Data, { person: p, photoIds }: Recipient): Promise<File[]> {
  const out: File[] = []
  for (let k = 0; k < photoIds.length; k++) {
    const [bytes] = await exportImages(photoIds[k], [{ maxEdge: d.settings.maxEdge, q: 0.86 }], k)
    out.push(new File([bytes as BlobPart], attachmentName(d, p, k), { type: 'image/jpeg' }))
  }
  return out
}

export function openMailto(parts: MailParts) {
  const a = document.createElement('a')
  a.href = mailtoUrl(parts)
  a.rel = 'noopener'
  document.body.append(a)
  a.click()
  a.remove()
}
