import Papa from 'papaparse'
import type { Person } from './store'

// UTF-8 versuchen, sonst Excel-Encoding (Windows-1252)
export async function readText(file: File) {
  const buf = await file.arrayBuffer()
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^\uFEFF/, '') }
  catch { return new TextDecoder('windows-1252').decode(buf) }
}

const key = (h: string) => h.toLowerCase().replace(/[\s_.\-]/g, '')

export function parsePeople(text: string): Omit<Person, 'id'>[] {
  const res = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true })
  const fields = res.meta.fields ?? []
  const pick = (c: string[]) => fields.find((f) => c.includes(key(f)))
  const fFirst = pick(['vorname', 'firstname', 'first', 'givenname', 'prenom'])
  const fLast = pick(['nachname', 'lastname', 'last', 'surname', 'familienname', 'nom'])
  const fName = pick(['name', 'fullname', 'teilnehmer', 'teilnehmerin', 'teilnehmende', 'person'])
  const fMail =
    pick(['email', 'mail', 'emailadresse', 'emailaddress', 'mailadresse']) ??
    fields.find((f) => res.data.some((r) => /@/.test(r[f] ?? '')))

  return res.data
    .map((r) => {
      const g = (f?: string) => (f ? (r[f] ?? '').trim() : '')
      let first = g(fFirst), last = g(fLast)
      if (!first && !last && fName) {
        const parts = g(fName).split(/\s+/)
        last = parts.length > 1 ? parts.pop()! : ''
        first = parts.join(' ')
      } else if (!first && fName && fName !== fLast) first = g(fName)
      return { first, last, email: g(fMail) }
    })
    .filter((p) => p.first || p.last || p.email)
}
