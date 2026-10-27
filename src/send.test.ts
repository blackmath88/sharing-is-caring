import { describe, expect, it } from 'vitest'
import { mailParts, mailtoUrl } from './send'
import { DEFAULT_SETTINGS, DEFAULT_TPL } from './templates'
import type { Data } from './store'

const d: Data = {
  photos: [], people: [], tags: {}, excluded: [],
  settings: { ...DEFAULT_SETTINGS, event: 'Sommerfest', senderName: 'Mara Keller' },
  tpl: { ...DEFAULT_TPL, body: 'Hallo {vorname}\n\n---\n{post}\n---\n\nGruss, {absender}' },
}
const r = { person: { id: '1', first: 'Jonas', last: 'Brunner', email: 'jonas@example.com' }, photoIds: ['a', 'b'] }

describe('mailParts', () => {
  it('fills recipient, subject and a plain-text body with the copy link', () => {
    const m = mailParts(d, r, 'https://x.test/#/post?t=abc')
    expect(m.to).toBe('jonas@example.com')
    expect(m.subject).toBe('Ihre Fotos vom Sommerfest')
    expect(m.text).toContain('Hallo Jonas')
    expect(m.text).toContain('Beim Sommerfest ging es um')
    expect(m.text).toContain('Gruss, Mara Keller')
    expect(m.text.endsWith('LinkedIn-Text zum Kopieren: https://x.test/#/post?t=abc')).toBe(true)
  })
})

describe('mailtoUrl', () => {
  it('encodes subject and body with CRLF line breaks', () => {
    const u = mailtoUrl({ to: 'a@b.ch', subject: 'Grüsse & Co', text: 'Zeile 1\nZeile 2' })
    expect(u.startsWith('mailto:a@b.ch?subject=Gr%C3%BCsse%20%26%20Co&body=')).toBe(true)
    expect(u).toContain('Zeile%201%0D%0AZeile%202')
    expect(decodeURIComponent(u.split('&body=')[1])).toBe('Zeile 1\r\nZeile 2')
  })
})
