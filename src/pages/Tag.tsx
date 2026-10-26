import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useStore, type Person } from '../store'
import { prefetch, useImage } from '../db'
import { Thumb } from '../Thumb'

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function TagPage() {
  const { photos, people, tags, tag, untag, setTags, addPerson } = useStore()
  const [only, setOnly] = useState<string[] | null>(null) // Snapshot "ohne Person"
  const list = only ? photos.filter((p) => only.includes(p.id)) : photos
  const [idx, setIdx] = useState(0)
  const cur = list[Math.min(idx, list.length - 1)]
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const active = useRef<HTMLButtonElement>(null)
  const view = useImage('v', cur?.id)

  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const curTags = (cur && tags[cur.id]) || []
  const query = q.trim()

  const options = useMemo(() => {
    const toks = fold(query).split(/\s+/).filter(Boolean)
    const res: Person[] = toks.length
      ? people.filter((p) => { const h = fold(`${p.first} ${p.last} ${p.email}`); return toks.every((t) => h.includes(t)) })
      : recent.map((id) => byId.get(id)!).filter(Boolean)
    return res.filter((p) => !curTags.includes(p.id)).slice(0, 8)
  }, [query, people, recent, byId, curTags])

  const exact = options.some((p) => fold(`${p.first} ${p.last}`) === fold(query))
  const canCreate = query.length > 1 && !exact
  const total = options.length + (canCreate ? 1 : 0)
  const s = Math.min(sel, Math.max(0, total - 1))

  useEffect(() => { input.current?.focus(); prefetch(list[idx + 1]?.id) }, [cur?.id])
  useEffect(() => { active.current?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [cur?.id])

  const go = (d: number) => { setIdx(Math.max(0, Math.min(list.length - 1, idx + d))); setQ(''); setSel(0) }

  function pick(i: number) {
    if (!cur) return
    let id: string
    if (i < options.length) id = options[i].id
    else {
      const parts = query.split(/\s+/)
      const last = parts.length > 1 ? parts.pop()! : ''
      id = addPerson({ first: parts.join(' '), last, email: '' })
    }
    tag(cur.id, id)
    setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 6))
    setQ(''); setSel(0)
  }

  function onKey(e: React.KeyboardEvent) {
    const k = e.key
    if (k === 'ArrowDown') { e.preventDefault(); setSel(Math.min(total - 1, s + 1)) }
    else if (k === 'ArrowUp') { e.preventDefault(); setSel(Math.max(0, s - 1)) }
    else if (k === 'Enter') { e.preventDefault(); query ? total && pick(s) : go(1) }
    else if (k === 'Escape') setQ('')
    else if (!query && k === 'Backspace' && curTags.length) untag(cur.id, curTags[curTags.length - 1])
    else if (!query && (k === 'ArrowRight' || k === 'ArrowLeft')) { e.preventDefault(); go(k === 'ArrowRight' ? 1 : -1) }
    else if (!query && /^[1-6]$/.test(k) && options[+k - 1]) { e.preventDefault(); pick(+k - 1) }
  }

  function setFilter(untaggedOnly: boolean) {
    if (untaggedOnly) { setOnly(photos.filter((p) => !tags[p.id]?.length).map((p) => p.id)); setIdx(0) }
    else { setOnly(null); setIdx(Math.max(0, photos.findIndex((p) => p.id === cur?.id))) }
    setQ('')
  }

  if (!photos.length) return (
    <div className="page"><h1>Markieren</h1>
      <p className="lede">Noch keine Fotos da. <Link to="/">Zuerst importieren.</Link></p></div>
  )

  return (
    <div className="tagger">
      <div className="stage">
        <div className="stage-bar">
          <div className="seg" role="group" aria-label="Filter">
            <button className={!only ? 'on' : ''} onClick={() => setFilter(false)}>Alle</button>
            <button className={only ? 'on' : ''} onClick={() => setFilter(true)}>Ohne Person</button>
          </div>
          <span className="muted">{list.length ? `${Math.min(idx, list.length - 1) + 1} von ${list.length}` : ''}</span>
        </div>
        {cur ? (
          <div className="stage-img">
            <button className="nav-arrow left" onClick={() => go(-1)} disabled={idx === 0} aria-label="Vorheriges Foto">‹</button>
            {view && <img src={view} alt={cur.name} />}
            <button className="nav-arrow right" onClick={() => go(1)} disabled={idx >= list.length - 1} aria-label="Nächstes Foto">›</button>
          </div>
        ) : <p className="empty">Alle Fotos haben eine Person. <button className="link-btn" onClick={() => setFilter(false)}>Alle zeigen</button></p>}
      </div>

      <aside className="side">
        <div>
          <h2>Wer ist auf dem Bild?</h2>
          <p className="muted small">{cur?.name}</p>
        </div>

        <div className="chips">
          {curTags.map((id) => {
            const p = byId.get(id)
            return p && (
              <span className="chip" key={id}>
                {p.first} {p.last}
                <button onClick={() => untag(cur.id, id)} aria-label={`${p.first} entfernen`}>×</button>
              </span>
            )
          })}
          {!curTags.length && <span className="muted small">Noch niemand markiert.</span>}
        </div>

        <div className="picker">
          <input ref={input} className="field" placeholder="Name tippen" value={q} disabled={!cur}
            onChange={(e) => { setQ(e.target.value); setSel(0) }} onKeyDown={onKey} />
          {total > 0 && (
            <ul className="opts" role="listbox">
              {!query && <li className="opts-head">Zuletzt</li>}
              {options.map((p, i) => (
                <li key={p.id}>
                  <button className={i === s ? 'sel' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(i)} onMouseEnter={() => setSel(i)}>
                    <span>{p.first} {p.last}</span>
                    <span className="muted">{!query ? i + 1 : p.email}</span>
                  </button>
                </li>
              ))}
              {canCreate && (
                <li><button className={s === options.length ? 'sel' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(options.length)}>
                  <span>„{query}“ neu anlegen</span>
                </button></li>
              )}
            </ul>
          )}
        </div>

        {cur && people.length > 0 && (
          <div className="all-row">
            {curTags.length < people.length && (
              <button className="link-btn" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setTags(cur.id, people.map((p) => p.id)); setQ('') }}>
                Alle {people.length} markieren
              </button>
            )}
            {curTags.length > 0 && (
              <button className="link-btn" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setTags(cur.id, []); setQ('') }}>
                Alle entfernen
              </button>
            )}
          </div>
        )}

        <dl className="keys">
          <dt><kbd>↵</kbd></dt><dd>hinzufügen, im leeren Feld: nächstes Foto</dd>
          <dt><kbd>1</kbd>–<kbd>6</kbd></dt><dd>aus „Zuletzt“ wählen</dd>
          <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>blättern</dd>
          <dt><kbd>⌫</kbd></dt><dd>letzte Markierung entfernen</dd>
        </dl>
      </aside>

      <div className="strip">
        {list.map((p, i) => {
          const n = tags[p.id]?.length ?? 0
          const on = p.id === cur?.id
          return (
            <button key={p.id} ref={on ? active : undefined} className={on ? 'on' : ''} onClick={() => { setIdx(i); setQ('') }} aria-label={p.name}>
              <Thumb id={p.id} />
              {n > 0 && <span className="badge">{n}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
