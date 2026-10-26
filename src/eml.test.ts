import { describe, expect, it } from 'vitest'
import { buildEml } from './eml'

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64')

describe('buildEml', () => {
  const att = { name: 'a.jpg', data: new Uint8Array([255, 216, 255]) }

  it('writes an unsent draft with CRLF line endings', () => {
    const eml = buildEml({ to: { name: 'Mara Keller', email: 'mara@example.com' }, subject: 'Hallo', body: 'Hi\nda', attachments: [] })
    expect(eml).toMatch(/^To: "Mara Keller" <mara@example.com>\r\n/)
    expect(eml).toContain('X-Unsent: 1\r\n')
    expect(eml).not.toMatch(/[^\r]\n/)
    expect(eml).toContain(b64('Hi\r\nda'))
  })
  it('encodes non-ASCII names and subjects', () => {
    const eml = buildEml({ to: { name: 'Jürg Müller', email: 'j@example.com' }, subject: 'Grüsse', body: '', attachments: [] })
    expect(eml).toContain('=?UTF-8?B?')
    expect(eml).not.toContain('Jürg')
  })
  it('nests mixed > related > alternative when html and inline images are given', () => {
    const eml = buildEml({
      to: { name: '', email: 'x@example.com' }, subject: 's', body: 'text', html: '<p>html</p>',
      inline: [{ cid: 'foto1@test', data: att.data }], attachments: [att],
    })
    const order = ['multipart/mixed', 'multipart/related', 'multipart/alternative', 'text/plain', 'text/html', 'Content-ID: <foto1@test>', 'filename="a.jpg"']
      .map((m) => eml.indexOf(m))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order]).toEqual([...order].sort((a, b) => a - b))
    expect(eml.match(/Content-Type: image\/jpeg/g)).toHaveLength(2)
  })
  it('stays plain text only without html', () => {
    const eml = buildEml({ to: { name: '', email: 'x@example.com' }, subject: 's', body: 'text', attachments: [att] })
    expect(eml).not.toContain('multipart/alternative')
    expect(eml).toContain('text/plain')
  })
})
