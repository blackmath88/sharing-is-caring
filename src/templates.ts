import type { Person, Settings, Tpl } from './store'

export const DEFAULT_SETTINGS: Settings = {
  event: 'Leadership Connect',
  senderName: '',
  senderEmail: '',
  maxEdge: 2000,
}

export const DEFAULT_TPL: Tpl = {
  subject: 'Ihre Fotos vom {event}',
  body: `Guten Tag {vorname} {nachname}

Herzlichen Dank, dass Sie beim {event} dabei waren. Unser Fotograf hat den Anlass begleitet; im Anhang finden Sie die Aufnahmen, auf denen Sie zu sehen sind ({fotos}).

Sie dürfen die Bilder gerne verwenden, zum Beispiel für einen LinkedIn-Beitrag. Falls es hilft, hier ein Vorschlag, den Sie frei anpassen können:

---
{post}
---

Wenn Sie uns im Beitrag markieren, teilen wir ihn gerne weiter. So erreicht das Thema Führung noch ein paar Menschen mehr.

Herzliche Grüsse
{absender}`,
  post: `Beim {event} ging es um Führung, ums Zuhören und um die Frage, was gute Führung im Alltag ausmacht.

Was ich mitnehme: [Ihr Gedanke in einem Satz]

Danke an das Team für den Rahmen und an alle für die offenen Gespräche.

#Führung #Leadership #LeadershipConnect`,
}

export const PLACEHOLDERS: [string, string][] = [
  ['{vorname}', 'Vorname'],
  ['{nachname}', 'Nachname'],
  ['{fotos}', '„3 Fotos“'],
  ['{event}', 'Anlass'],
  ['{absender}', 'Absender'],
  ['{post}', 'LinkedIn-Vorschlag'],
]

export const fill = (t: string, v: Record<string, string>) =>
  t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m))

export function varsFor(p: Pick<Person, 'first' | 'last'>, count: number, s: Settings, postTpl: string): Record<string, string> {
  const base: Record<string, string> = {
    vorname: p.first,
    nachname: p.last,
    name: `${p.first} ${p.last}`.trim(),
    anzahl: String(count),
    fotos: count === 1 ? 'ein Foto' : `${count} Fotos`,
    event: s.event,
    absender: s.senderName || s.event,
  }
  return { ...base, post: fill(postTpl, base) }
}
