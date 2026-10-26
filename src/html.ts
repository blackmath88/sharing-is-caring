// HTML-Variante der Mail: Textvorlage als Absätze, {post} als LinkedIn-artige Karte
// mit den Fotos als Beitragsbild. Tabellen + Inline-Styles, damit Outlook (Word-Engine) mitspielt.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const FONT = 'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,Helvetica,sans-serif;'

const paras = (text: string, style: string) =>
  text.trim().split(/\n\s*\n/).map((p) => `<p style="margin:0 0 10px;${style}">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')

export const initials = (first: string, last: string) =>
  ((first.trim()[0] ?? '') + (last.trim()[0] ?? '')).toUpperCase() || '•'

// Base64url (UTF-8), für den Post in der Kopier-URL
export const b64url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const copyUrl = (post: string) =>
  `${location.origin}${location.pathname}#/post?t=${b64url(post)}`

export type InlineImg = { cid: string }

export function postCard(o: { name: string; first: string; last: string; post: string; images: InlineImg[]; copyHref: string }) {
  const n = o.images.length
  const cell = (im: InlineImg, w: string) =>
    `<td width="${w}" valign="top" style="padding:2px;"><img src="cid:${im.cid}" width="100%" alt="" style="display:block;width:100%;height:auto;border:0;"></td>`
  let media = ''
  if (n === 1) media = `<tr>${cell(o.images[0], '100%')}</tr>`
  else if (n > 1) {
    const rows: string[] = []
    for (let i = 0; i < n; i += 2) {
      const a = o.images[i], b = o.images[i + 1]
      rows.push(`<tr>${cell(a, '50%')}${b ? cell(b, '50%') : '<td width="50%"></td>'}</tr>`)
    }
    media = rows.join('')
  }
  const act = (t: string) => `<td align="center" style="padding:8px 4px;font-size:13px;font-weight:600;color:#666;${FONT}">${t}</td>`
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;">
<tr><td style="background:#f3f2ef;padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background:#ffffff;border:1px solid #d9d9d9;border-radius:9px;">
  <tr><td style="padding:12px 14px 4px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="48" height="48" align="center" valign="middle" style="width:48px;height:48px;background:#26333c;color:#ffffff;font-weight:700;font-size:17px;border-radius:24px;${FONT}">${esc(initials(o.first, o.last))}</td>
      <td valign="middle" style="padding-left:9px;${FONT}">
        <div style="font-weight:700;font-size:15px;color:#1f1f1f;">${esc(o.name)}</div>
        <div style="font-size:12px;color:#666;">Vorschlag für Ihren Beitrag</div>
        <div style="font-size:12px;color:#777;">Jetzt · 🌐</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:6px 14px 10px;color:#1f1f1f;${FONT}">${paras(o.post, 'font-size:14.5px;line-height:1.45;')}</td></tr>
  ${media ? `<tr><td style="border-top:1px solid #eee;border-bottom:1px solid #eee;padding:2px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${media}</table></td></tr>` : ''}
  <tr><td style="padding:4px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      ${act('👍 Gefällt mir')}${act('💬 Kommentieren')}${act('↗ Teilen')}
    </tr></table>
  </td></tr>
  <tr><td align="center" style="padding:4px 14px 14px;${FONT}">
    <a href="${esc(o.copyHref)}" style="display:inline-block;border:1px solid #0a66c2;color:#0a66c2;border-radius:18px;padding:7px 16px;font-size:13px;font-weight:700;text-decoration:none;">Text kopieren</a>
    <div style="font-size:11px;color:#888;margin-top:6px;">Öffnet eine Seite mit dem Text und einem Kopieren-Knopf.</div>
  </td></tr>
</table>
</td></tr>
</table>`
}

// bodyText: bereits gefüllte Vorlage, aber mit {post} noch als Platzhalter.
export function buildHtml(bodyText: string, card: string) {
  const TOKEN = '\u0000POST\u0000'
  const text = bodyText.replace(/\{post\}/g, TOKEN)
  const blocks = text.trim().split(/\n\s*\n/).map((b) => b.split('\n').filter((l) => !/^\s*-{3,}\s*$/.test(l)).join('\n').trim()).filter(Boolean)
  let placed = false
  const html = blocks.map((b) => {
    if (b.includes(TOKEN)) { placed = true; return card }
    return `<p style="margin:0 0 12px;">${esc(b).replace(/\n/g, '<br>')}</p>`
  }).join('') + (placed ? '' : card)
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:12px;background:#ffffff;color:#1f1f1f;font-size:14.5px;line-height:1.5;${FONT}">
<div style="max-width:620px;">${html}</div>
</body></html>`
}
