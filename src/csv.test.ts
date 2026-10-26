import { describe, expect, it } from 'vitest'
import { parsePeople } from './csv'

describe('parsePeople', () => {
  it('reads Vorname/Nachname/E-Mail with semicolons', () => {
    const p = parsePeople('Vorname;Nachname;E-Mail\nMara;Keller;mara@example.com\n')
    expect(p).toEqual([{ first: 'Mara', last: 'Keller', email: 'mara@example.com' }])
  })
  it('accepts English headers and odd spacing', () => {
    const p = parsePeople('First name, Last_name, Email-Address\nJonas, Brunner, jonas@example.com')
    expect(p[0]).toEqual({ first: 'Jonas', last: 'Brunner', email: 'jonas@example.com' })
  })
  it('splits a single Name column into first and last', () => {
    const p = parsePeople('Name,Mail\nLeila Haddad,leila@example.com')
    expect(p[0]).toEqual({ first: 'Leila', last: 'Haddad', email: 'leila@example.com' })
  })
  it('falls back to any column that holds an address', () => {
    const p = parsePeople('Vorname,Nachname,Kontakt\nNina,Rossi,nina@example.com')
    expect(p[0].email).toBe('nina@example.com')
  })
  it('skips empty rows and keeps people without email', () => {
    const p = parsePeople('Vorname,Nachname,E-Mail\n,,\nDavid,Steiner,\n')
    expect(p).toEqual([{ first: 'David', last: 'Steiner', email: '' }])
  })
})
