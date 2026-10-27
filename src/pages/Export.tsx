import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { dataOf, getRecipients, useStore } from '../store'
import { buildOne, buildZip, download, estimateMB, slug } from '../exporter'
import { canShareFiles, mailParts, openMailto, shareFiles } from '../send'
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
  const [busy, setBusy] = useState<string | null>(null)
  const backup = useRef<HTMLInputElement>(null)
  const abort = useRef<AbortController | null>(null)
  const shared = useRef(new Map<string, File[]>()) // vorbereitete Fotos pro Person fürs Share-Sheet
  const [armed, setArmed] = useState<string | null>(null)
  const share = canShareFiles()

  // Senden: Share-Sheet mit Fotos, sonst mailto. Nach dem Verkleinern kann die Klick-Erlaubnis
  // abgelaufen sein; dann bleibt der Knopf „Jetzt senden“ und der zweite Klick teilt sofort.
  async function send(r: (typeof recips)[number]) {
    const id = r.person.id
    const d = dataOf(useStore.getState())
    const parts = mailParts(d, r)
    setErr('')
    if (share) {
      let files = shared.current.get(id)
      if (!files) {
        setBusy(id)
        try { files = await shareFiles(d, r); shared.current.set(id, files) }
        catch (e) { setErr((e as Error).message); setBusy(null); return }
        setBusy(null)
      }
      try { await navigator.share({ title: parts.subject, text: parts.text, files }); setArmed(null); return }
      catch (e) {
        const n = (e as Error).name
        if (n === 'AbortError') return
        if (n === 'NotAllowedError') { setArmed(id); return }
      }
    }
    openMailto(parts)
  }

  // Einzelne Mail als .eml: Doppelklick öffnet sie im Mailprogramm als Entwurf
  async function one(id: string) {
    setErr(''); setBusy(id)
    try { const { blob, name } = await buildOne(dataOf(useStore.getState()), id); download(blob, name) }
    catch (e) { setErr((e as Error).message) }
    setBusy(null)
  }

  async function run() {
    setErr(''); setDone(null)
    abort.current = new AbortController()
    try {
      const { blob, count } = await buildZip(dataOf(useStore.getState()), (f, label) => setProg({ f, label }), abort.current.signal)
      const name = `${slug(settings.event)}_SharingIsCaring.zip`
      download(blob, name)
      setDone({ blob, name, count })
    } catch (e) { if ((e as Error).name !== 'AbortError') setErr((e as Error).message) }
    abort.current = null
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
            <thead><tr><th aria-label="Senden" /><th>Person</th><th>E-Mail</th><th>Fotos</th><th>Grösse</th><th aria-label="Aktionen" /></tr></thead>
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
                    <td className="actions">
                      <button className="btn slim primary" disabled={!!busy || !!prog || !validMail(p.email)} onClick={() => send({ person: p, photoIds })}
                        title={share ? 'Fotos und Text ans Mailprogramm übergeben' : 'Entwurf im Mailprogramm öffnen (Fotos aus dem Ordner anhängen)'}>
                        {busy === p.id ? '…' : armed === p.id ? 'Jetzt senden' : 'Senden'}
                      </button>
                      <button className="btn slim" disabled={!!busy || !!prog} onClick={() => one(p.id)} title="Vollständige Mail als Datei: in klassischem Outlook als Entwurf, sonst öffnen und weiterleiten">.eml</button>
                    </td>
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
            <span>{prog.label} <button className="link-btn" onClick={() => abort.current?.abort()}>Abbrechen</button></span>
          </div>
        )}
        {done && !prog && (
          <span className="ok">{done.count} Entwürfe erstellt. <button className="link-btn" onClick={() => download(done.blob, done.name)}>Nochmals herunterladen</button></span>
        )}
      </div>
      {err && <p className="note error">{err}</p>}

      <dl className="how">
        <dt>Senden</dt>
        <dd>{share
          ? 'Übergibt Fotos und Text ans Mailprogramm deiner Wahl. Empfänger und Betreff dort kurz prüfen, dann senden.'
          : 'Öffnet einen Entwurf im Mailprogramm mit Empfänger, Betreff und Text. Die Fotos liegen im Ordner der Person im ZIP und werden angehängt.'}
          {' '}Der LinkedIn-Text steckt als Link zum Kopieren im Mailtext.</dd>
        <dt>.eml</dt>
        <dd>Die vollständige Mail als Datei, mit Fotos im Anhang und dem LinkedIn-Beitrag als Karte. Klassisches Outlook (Windows) öffnet sie als Entwurf. Neues Outlook, Outlook für Mac und Apple Mail zeigen sie als empfangene Nachricht: öffnen, <b>Weiterleiten</b>, Empfänger wählen, senden.</dd>
        <dt>ZIP</dt>
        <dd>Alles auf einmal: pro Person ein Ordner mit .eml, LinkedIn-Text und den Fotos, dazu eine Übersicht als CSV.</dd>
      </dl>

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
