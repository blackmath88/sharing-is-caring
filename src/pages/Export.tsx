import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { dataOf, getRecipients, useStore } from '../store'
import { buildZip, download, estimateMB, slug } from '../exporter'
import { Thumb } from '../Thumb'

const validMail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export function ExportPage() {
  const state = useStore()
  const { photos, people, tags, excluded, settings, toggleExcluded, updatePerson, load } = state
  const recips = getRecipients({ photos, people, tags })
  const active = recips.filter((r) => !excluded.includes(r.person.id))
  const untagged = photos.filter((p) => !tags[p.id]?.length).length
  const missing = active.filter((r) => !validMail(r.person.email)).length
  const [prog, setProg] = useState<{ f: number; label: string } | null>(null)
  const [done, setDone] = useState<{ blob: Blob; name: string; count: number } | null>(null)
  const [err, setErr] = useState('')
  const backup = useRef<HTMLInputElement>(null)

  async function run() {
    setErr(''); setDone(null)
    try {
      const { blob, count } = await buildZip(dataOf(useStore.getState()), (f, label) => setProg({ f, label }))
      const name = `${slug(settings.event)}_Fotodank.zip`
      download(blob, name)
      setDone({ blob, name, count })
    } catch (e) { setErr((e as Error).message) }
    setProg(null)
  }

  async function restore(f?: File) {
    if (!f) return
    try { load(JSON.parse(await f.text())); setErr('') }
    catch { setErr('Diese Datei ist keine gültige Sicherung.') }
  }

  return (
    <div className="page">
      <h1>Export</h1>
      <p className="lede">
        {active.length
          ? <>{active.length} {active.length === 1 ? 'Mail' : 'Mails'} mit {new Set(active.flatMap((r) => r.photoIds)).size} Fotos.</>
          : 'Noch niemand zum Anschreiben.'}
        {untagged > 0 && <> {untagged} {untagged === 1 ? 'Foto ist' : 'Fotos sind'} noch ohne Person. <Link to="/taggen">Markieren</Link></>}
      </p>

      {recips.length > 0 && (
        <div className="panel">
          <table className="recips">
            <thead><tr><th aria-label="Senden" /><th>Person</th><th>E-Mail</th><th>Fotos</th><th>Grösse</th></tr></thead>
            <tbody>
              {recips.map(({ person: p, photoIds }) => {
                const off = excluded.includes(p.id)
                const mb = estimateMB(photoIds.length, settings.maxEdge)
                return (
                  <tr key={p.id} className={off ? 'off' : ''}>
                    <td><input type="checkbox" checked={!off} onChange={() => toggleExcluded(p.id)} aria-label={`${p.first} ${p.last} anschreiben`} /></td>
                    <td>{p.first} {p.last}{off && <span className="tag-off">nicht versenden</span>}</td>
                    <td><input className={`field slim${!off && !validMail(p.email) ? ' invalid' : ''}`} value={p.email} placeholder="E-Mail ergänzen" onChange={(e) => updatePerson(p.id, { email: e.target.value.trim() })} /></td>
                    <td><div className="tiny-thumbs">{photoIds.slice(0, 4).map((id) => <Thumb key={id} id={id} />)}{photoIds.length > 4 && <span className="muted small">+{photoIds.length - 4}</span>}</div></td>
                    <td className={mb > 20 ? 'warn' : 'muted'}>ca. {mb.toFixed(1)} MB</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {missing > 0 && <p className="note error">{missing} ohne gültige E-Mail. Die Entwürfe entstehen trotzdem, Empfänger dann in Outlook ergänzen.</p>}
      {recips.some((r) => estimateMB(r.photoIds.length, settings.maxEdge) > 20) && (
        <p className="note">Über 20 MB kommen bei manchen Postfächern nicht an. Kleinere Bildgrösse unter Texte wählen.</p>
      )}

      <div className="export-row">
        <button className="btn primary" disabled={!active.length || !!prog} onClick={run}>ZIP erstellen</button>
        {prog && (
          <div className="prog grow">
            <div className="bar"><i style={{ width: `${prog.f * 100}%` }} /></div>
            <span>{prog.label}</span>
          </div>
        )}
        {done && !prog && (
          <span className="ok">{done.count} Entwürfe erstellt. <button className="link-btn" onClick={() => download(done.blob, done.name)}>Nochmals herunterladen</button></span>
        )}
      </div>
      {err && <p className="note error">{err}</p>}

      <p className="muted small explain">
        Pro Person ein Ordner mit Mail-Entwurf (.eml), LinkedIn-Text und den Fotos. Doppelklick auf die .eml öffnet in Outlook einen sendebereiten Entwurf mit Anhängen.
      </p>

      <section className="backup">
        <h2>Sicherung</h2>
        <p className="muted small">Personen, Markierungen und Texte als Datei. Ohne Bilder: nach dem Laden die Fotos mit denselben Dateinamen erneut importieren.</p>
        <div className="row">
          <button className="btn" onClick={() => download(new Blob([JSON.stringify(dataOf(state), null, 1)], { type: 'application/json' }), `${slug(settings.event)}_Sicherung.json`)}>Sicherung speichern</button>
          <button className="btn" onClick={() => backup.current?.click()}>Sicherung laden</button>
          <input ref={backup} type="file" accept=".json,application/json" hidden onChange={(e) => { restore(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      </section>
    </div>
  )
}
