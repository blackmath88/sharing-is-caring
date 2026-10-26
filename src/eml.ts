const enc = new TextEncoder()

function b64(u8: Uint8Array) {
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}
const wrap = (s: string) => s.replace(/.{1,76}/g, '$&\r\n')
const ascii = (s: string) => /^[\x20-\x7e]*$/.test(s)
const word = (s: string) => (ascii(s) ? s : `=?UTF-8?B?${b64(enc.encode(s))}?=`)
const addr = (name: string, email: string) =>
  !name ? email : `${ascii(name) ? `"${name.replace(/"/g, '')}"` : word(name)} <${email}>`

type Att = { name: string; data: Uint8Array }
type Inline = { cid: string; data: Uint8Array }

const bnd = () => 'fd_' + crypto.randomUUID().replace(/-/g, '')
const textPart = (type: string, s: string) =>
  [`Content-Type: ${type}; charset=UTF-8`, 'Content-Transfer-Encoding: base64', '', wrap(b64(enc.encode(s.replace(/\r?\n/g, '\r\n'))))].join('\r\n')
const multi = (type: string, b: string, parts: string[]) =>
  [`Content-Type: multipart/${type}; boundary="${b}"`, '', ...parts.map((p) => `--${b}\r\n${p}`), `--${b}--`].join('\r\n')

// Aufbau: mixed( related( alternative(text, html), inline-Bilder ), Anhänge )
// X-Unsent: 1 → Outlook öffnet die Datei als sendebereiten Entwurf
export function buildEml(o: {
  from?: { name: string; email: string }
  to: { name: string; email: string }
  subject: string
  body: string
  html?: string
  inline?: Inline[]
  attachments: Att[]
}) {
  let content = textPart('text/plain', o.body)
  if (o.html) {
    content = multi('alternative', bnd(), [content, textPart('text/html', o.html)])
    if (o.inline?.length) content = multi('related', bnd(), [content, ...o.inline.map((i) =>
      ['Content-Type: image/jpeg', 'Content-Transfer-Encoding: base64', `Content-ID: <${i.cid}>`, 'Content-Disposition: inline', '', wrap(b64(i.data))].join('\r\n'))])
  }
  const atts = o.attachments.map((a) =>
    [`Content-Type: image/jpeg; name="${a.name}"`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${a.name}"`, '', wrap(b64(a.data))].join('\r\n'))
  const head = [
    o.from?.email && `From: ${addr(o.from.name, o.from.email)}`,
    o.to.email && `To: ${addr(o.to.name, o.to.email)}`,
    `Subject: ${word(o.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
  ].filter(Boolean)
  return head.join('\r\n') + '\r\n' + multi('mixed', bnd(), [content, ...atts]) + '\r\n'
}
