import { describe, expect, it } from 'vitest'
import { b64url, buildHtml, initials, postCard } from './html'

describe('postCard', () => {
  it('renders name, initials, paragraphs, images and the copy link', () => {
    const h = postCard({ name: 'Mara Keller', first: 'Mara', last: 'Keller', post: 'Zeile 1\n\nZeile 2', images: [{ src: 'cid:a' }, { src: 'cid:b' }, { src: 'cid:c' }], copyHref: 'https://x.test/#/post?t=1' })
    expect(h).toContain('MK')
    expect(h).toContain('Mara Keller')
    expect(h).toContain('<p style="margin:0 0 10px;font-size:14.5px;line-height:1.45;">Zeile 1</p>')
    expect(h.match(/<img /g)).toHaveLength(3)
    expect(h).toContain('href="https://x.test/#/post?t=1"')
  })
  it('escapes html in user content', () => {
    const h = postCard({ name: 'A <b>', first: 'A', last: '', post: '<script>', images: [], copyHref: '' })
    expect(h).not.toContain('<script>')
    expect(h).toContain('&lt;script&gt;')
  })
})

describe('buildHtml', () => {
  it('replaces {post} with the card and drops --- separators', () => {
    const h = buildHtml('Hallo\n\n---\n{post}\n---\n\nGruss', '<table>CARD</table>')
    expect(h).toContain('<p style="margin:0 0 12px;">Hallo</p>')
    expect(h).toContain('<table>CARD</table>')
    expect(h).not.toContain('---')
    expect(h).not.toContain('{post}')
    expect(h.indexOf('Hallo')).toBeLessThan(h.indexOf('CARD'))
    expect(h.indexOf('CARD')).toBeLessThan(h.indexOf('Gruss'))
  })
  it('appends the card when the template has no {post}', () => {
    const h = buildHtml('Nur Text', 'CARD')
    expect(h.indexOf('Nur Text')).toBeLessThan(h.indexOf('CARD'))
  })
})

describe('helpers', () => {
  it('initials', () => { expect(initials('mara', 'keller')).toBe('MK'); expect(initials('', '')).toBe('•') })
  it('b64url round-trips utf-8', () => {
    const s = 'Grüsse & #Führung'
    const back = Buffer.from(b64url(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    expect(back).toBe(s)
  })
})
