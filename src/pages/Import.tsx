import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useStore } from '../store'
import { DEFAULT_SETTINGS } from '../templates'
import { hasOriginal, ingest } from '../db'
import { parsePeople, readText } from '../csv'
import { Thumb } from '../Thumb'
import { IconList, IconPhoto } from '../icons'

function Drop(p: { title: string; hint: string; icon: React.ReactNode; accept: string; multiple?: boolean; onFiles: (f: File[]) => void; children?: React.ReactNode }) {
  const [over, setOver] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className={`drop${over ? ' over' : ''}`} role="button" tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); p.onFiles([...e.dataTransfer.files]) }}>
      <input ref={ref} type="file" hidden accept={p.accept} multiple={p.multiple}
        onChange={(e) => { p.onFiles([...(e.target.files ?? [])]); e.target.value = '' }} />
      <div className="drop-icon">{p.icon}</div>
      <div className="drop-title">{p.title}</div>
      <div className="drop-hint">{p.hint}</div>
      {p.children}
    </div>
  )
}

export function ImportPage() {
  const { photos, people, settings, addPhoto, mergePeople, clearPeople, setSettings } = useStore()
  const [demo, setDemo] = useState(false)
  const [prog, setProg] = useState<{ done: number; total: number } | null>(null)
  const [photoMsg, setPhotoMsg] = useState('')
  const [listMsg, setListMsg] = useState<{ text: string; error?: boolean } | null>(null)

  async function onPhotos(files: File[]) {
    const imgs = files
      .filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }))
    const failed: string[] = []
    let skipped = 0
    for (let i = 0; i < imgs.length; i++) {
      setProg({ done: i, total: imgs.length })
      const f = imgs[i]
      const known = useStore.getState().photos.find((p) => p.name === f.name && p.size === f.size)
      if (known && (await hasOriginal(known.id))) { skipped++; continue }
      try {
        const id = known?.id ?? crypto.randomUUID()
        const dim = await ingest(f, id)
        if (!known) addPhoto({ id, name: f.name, size: f.size, ...dim })
      } catch { failed.push(f.name) }
    }
    setProg(null)
    setPhotoMsg([
      skipped && `${skipped} schon vorhanden, übersprungen.`,
      failed.length && `${failed.length} nicht lesbar (z. B. HEIC): ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? ' …' : ''}`,
    ].filter(Boolean).join(' '))
  }

  async function onList(files: File[]) {
    const f = files[0]
    if (!f) return
    if (/\.xlsx?$/i.test(f.name)) return setListMsg({ text: 'Excel-Dateien bitte zuerst als CSV speichern.', error: true })
    const rows = parsePeople(await readText(f))
    if (!rows.length) return setListMsg({ text: 'Keine Personen erkannt. Erwartet werden Spalten wie Vorname, Nachname, E-Mail.', error: true })
    const { added, updated } = mergePeople(rows)
    setListMsg({ text: `${added} Personen übernommen${updated ? `, ${updated} aktualisiert` : ''}.` })
  }

  const noMail = people.filter((p) => !p.email).length

  // Beispieldaten aus public/demo: erfundene Personen, generierte Bilder
  async function loadDemo() {
    setDemo(true)
    try {
      const file = async (path: string, type: string) => new File([await (await fetch(path)).blob()], path.split('/').pop()!, { type })
      const imgs = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((i) => file(`demo/photo_0${i}.jpg`, 'image/jpeg')))
      await onPhotos(imgs)
      await onList([await file('demo/teilnehmende.csv', 'text/csv')])
      if (settings.event === DEFAULT_SETTINGS.event) setSettings({ event: 'Sommerfest 2026' })
    } catch { setListMsg({ text: 'Beispiel konnte nicht geladen werden.', error: true }) }
    setDemo(false)
  }

  return (
    <div className="page">
      <h1>Fotos und Teilnehmende</h1>
      <p className="lede">Die Fotos vom Anlass und die Teilnehmerliste hierher ziehen. Beides bleibt in diesem Browser; nichts wird hochgeladen.</p>

      <div className="grid2">
        <Drop title="Fotos" icon={<IconPhoto size={20} />} hint="JPG, PNG oder WebP. Mehrere auf einmal." accept="image/*" multiple onFiles={onPhotos}>
          {prog && (
            <div className="prog">
              <div className="bar"><i style={{ width: `${(prog.done / prog.total) * 100}%` }} /></div>
              <span>Fotos vorbereiten: {prog.done + 1} von {prog.total}</span>
            </div>
          )}
        </Drop>
        <Drop title="Teilnehmerliste" icon={<IconList size={20} />} hint="CSV mit Vorname, Nachname, E-Mail. Komma oder Semikolon." accept=".csv,.txt,text/csv" onFiles={onList} />
      </div>

      <div className="grid2 below">
        <section>
          <div className="section-head">
            <h2>{photos.length} Fotos</h2>
          </div>
          {photoMsg && <p className="note">{photoMsg}</p>}
          {photos.length > 0 ? (
            <div className="mini-grid">
              {photos.slice(0, 23).map((p) => <Thumb key={p.id} id={p.id} />)}
              {photos.length > 23 && <span className="more">+{photos.length - 23}</span>}
            </div>
          ) : <p className="empty">Noch keine Fotos.</p>}
        </section>

        <section>
          <div className="section-head">
            <h2>{people.length} Personen</h2>
            {people.length > 0 && <button className="link-btn" onClick={() => confirm('Liste und alle Markierungen entfernen?') && clearPeople()}>Liste leeren</button>}
          </div>
          {listMsg && <p className={`note${listMsg.error ? ' error' : ''}`}>{listMsg.text}</p>}
          {noMail > 0 && <p className="note">{noMail} ohne E-Mail. Ergänzen lässt sich das beim Export.</p>}
          {people.length > 0 ? (
            <ul className="people">
              {people.slice(0, 12).map((p) => (
                <li key={p.id}><span>{p.first} {p.last}</span><span className="muted">{p.email || '–'}</span></li>
              ))}
              {people.length > 12 && <li className="muted">und {people.length - 12} weitere</li>}
            </ul>
          ) : <p className="empty">Noch keine Liste. Personen lassen sich auch beim Markieren direkt anlegen.</p>}
        </section>
      </div>

      {photos.length > 0 ? (
        <div className="next"><Link to="/taggen" className="btn primary">Weiter zum Markieren</Link></div>
      ) : !people.length && (
        <div className="next demo">
          <button className="btn" disabled={demo} onClick={loadDemo}>{demo ? 'Lädt …' : 'Mit Beispiel ausprobieren'}</button>
          <span className="muted small">8 generierte Fotos und 8 erfundene Personen, zum Durchklicken.</span>
        </div>
      )}
    </div>
  )
}
