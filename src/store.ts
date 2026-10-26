import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS, DEFAULT_TPL } from './templates'

export type Photo = { id: string; name: string; size: number; w: number; h: number }
export type Person = { id: string; first: string; last: string; email: string }
export type Settings = { event: string; senderName: string; senderEmail: string; maxEdge: number }
export type Tpl = { subject: string; body: string; post: string }
export type Data = {
  photos: Photo[]
  people: Person[]
  tags: Record<string, string[]> // photoId -> personIds
  excluded: string[] // personIds, die keine Mail bekommen
  settings: Settings
  tpl: Tpl
}

type Actions = {
  addPhoto: (p: Photo) => void
  mergePeople: (rows: Omit<Person, 'id'>[]) => { added: number; updated: number }
  addPerson: (p: Omit<Person, 'id'>) => string
  updatePerson: (id: string, patch: Partial<Person>) => void
  clearPeople: () => void
  tag: (photoId: string, personId: string) => void
  untag: (photoId: string, personId: string) => void
  setTags: (photoId: string, personIds: string[]) => void
  toggleExcluded: (personId: string) => void
  setSettings: (p: Partial<Settings>) => void
  setTpl: (p: Partial<Tpl>) => void
  load: (d: Partial<Data>) => void
  reset: () => void
}

const empty = (): Data => ({
  photos: [], people: [], tags: {}, excluded: [],
  settings: { ...DEFAULT_SETTINGS }, tpl: { ...DEFAULT_TPL },
})
const norm = (s: string) => s.trim().toLowerCase()

export const useStore = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...empty(),
      addPhoto: (p) => set((s) => (s.photos.some((x) => x.id === p.id) ? s : { photos: [...s.photos, p] })),
      mergePeople: (rows) => {
        const people = [...get().people]
        let added = 0, updated = 0
        for (const r of rows) {
          const i = people.findIndex(
            (p) => (r.email && norm(p.email) === norm(r.email)) ||
              (norm(p.first) === norm(r.first) && norm(p.last) === norm(r.last)),
          )
          if (i >= 0) { people[i] = { ...people[i], ...r, email: r.email || people[i].email }; updated++ }
          else { people.push({ id: crypto.randomUUID(), ...r }); added++ }
        }
        set({ people })
        return { added, updated }
      },
      addPerson: (p) => {
        const id = crypto.randomUUID()
        set((s) => ({ people: [...s.people, { id, ...p }] }))
        return id
      },
      updatePerson: (id, patch) => set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      clearPeople: () => set({ people: [], tags: {}, excluded: [] }),
      tag: (ph, pe) => set((s) => {
        const cur = s.tags[ph] ?? []
        return cur.includes(pe) ? s : { tags: { ...s.tags, [ph]: [...cur, pe] } }
      }),
      untag: (ph, pe) => set((s) => ({ tags: { ...s.tags, [ph]: (s.tags[ph] ?? []).filter((x) => x !== pe) } })),
      setTags: (ph, ids) => set((s) => ({ tags: { ...s.tags, [ph]: [...new Set(ids)] } })),
      toggleExcluded: (id) => set((s) => ({
        excluded: s.excluded.includes(id) ? s.excluded.filter((x) => x !== id) : [...s.excluded, id],
      })),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setTpl: (p) => set((s) => ({ tpl: { ...s.tpl, ...p } })),
      load: (d) => set({ ...empty(), ...d }),
      reset: () => set(empty()),
    }),
    { name: 'fotodank', version: 1 },
  ),
)

export const dataOf = (s: Data): Data => ({
  photos: s.photos, people: s.people, tags: s.tags, excluded: s.excluded, settings: s.settings, tpl: s.tpl,
})

export type Recipient = { person: Person; photoIds: string[] }
export const getRecipients = (d: Pick<Data, 'people' | 'photos' | 'tags'>): Recipient[] =>
  d.people
    .map((person) => ({ person, photoIds: d.photos.filter((p) => d.tags[p.id]?.includes(person.id)).map((p) => p.id) }))
    .filter((r) => r.photoIds.length > 0)
