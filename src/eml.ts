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

// X-Unsent: 1 → Outlook öffnet die Datei als sendebereiten Entwurf
export function buildEml(o: {
  from?: { name: string; email: string }
  to: { name: string; email: string }
  subject: string
  body: string
  attachments: Att[]
}) {
  const b = 'fd_' + crypto.randomUUID().replace(/-/g, '')
  const head = [
    o.from?.email && `From: ${addr(o.from.name, o.from.email)}`,
    o.to.email && `To: ${addr(o.to.name, o.to.email)}`,
    `Subject: ${word(o.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${b}"`,
  ].filter(Boolean)
  const parts = [
    `--${b}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap(b64(enc.encode(o.body.replace(/\r?\n/g, '\r\n')))),
  ]
  for (const a of o.attachments) {
    parts.push(
      `--${b}`,
      `Content-Type: image/jpeg; name="${a.name}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${a.name}"`,
      '',
      wrap(b64(a.data)),
    )
  }
  parts.push(`--${b}--`, '')
  return head.join('\r\n') + '\r\n\r\n' + parts.join('\r\n')
}
