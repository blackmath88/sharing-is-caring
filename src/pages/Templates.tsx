import { useEffect, useRef, useState } from 'react'
import { getRecipients, useStore, type Tpl } from '../store'
import { DEFAULT_TPL, PLACEHOLDERS, fill, varsFor } from '../templates'
import { Thumb } from '../Thumb'
import { useImages } from '../db'
import { buildHtml, copyUrl, postCard } from '../html'

type El = HTMLInputElement | HTMLTextAreaElement

export function TemplatesPage() {
  const { tpl, settings, setTpl, setSettings, photos, people, tags } = useStore()
  const focus = useRef<{ el: El; field: keyof Tpl } | null>(null)
  const recips = getRecipients({ photos, people, tags })
  const [pid, setPid] = useState<string>('')
  const r = recips.find((x) => x.person.id === pid) ?? recips[0]
  const person = r?.person ?? { first: 'Anna', last: 'Muster', email: 'anna.muster@example.ch' }
  const v = varsFor(person, r?.photoIds.length ?? 3, settings, tpl.post)
  const [mode, setMode] = useState<'html' | 'text'>('html')
  const thumbs = useImages('t', r?.photoIds ?? [])
  const html = buildHtml(fill(tpl.body, { ...v, post: '{post}' }), postCard({
    name: v.name, first: person.first, last: person.last, post: v.post, copyHref: copyUrl(v.post),
    images: thumbs.map((src) => ({ src })),
  }))
  const frame = useRef<HTMLIFrameElement>(null)
  const fit = () => { const f = frame.current; if (f?.contentDocument?.body) f.style.height = f.contentDocument.body.scrollHeight + 24 + 'px' }
  useEffect(() => { const id = setTimeout(fit, 60); return () => clearTimeout(id) }, [html])

  function insert(ph: string) {
    const f = focus.current
    if (!f) return
    const a = f.el.selectionStart ?? f.el.value.length, b = f.el.selectionEnd ?? a
    setTpl({ [f.field]: f.el.value.slice(0, a) + ph + f.el.value.slice(b) })
    requestAnimationFrame(() => { f.el.focus(); f.el.setSelectionRange(a + ph.length, a + ph.length) })
  }
  const bind = (field: keyof Tpl) => ({
    value: tpl[field],
    onChange: (e: React.ChangeEvent<El>) => setTpl({ [field]: e.target.value }),
    onFocus: (e: React.FocusEvent<El>) => { focus.current = { el: e.target, field } },
  })

  return (
    <div className="page wide">
      <h1>Texte</h1>
      <p className="lede">Eine Vorlage für alle. Platzhalter werden pro Person ersetzt; rechts siehst du das Ergebnis.</p>

      <div className="tpl">
        <div className="tpl-edit">
          <fieldset className="settings">
            <label>Anlass<input className="field" value={settings.event} onChange={(e) => setSettings({ event: e.target.value })} /></label>
            <label>Absender<input className="field" value={settings.senderName} placeholder="Vorname Nachname" onChange={(e) => setSettings({ senderName: e.target.value })} /></label>
            <label>Absender-Mail<input className="field" type="email" value={settings.senderEmail} placeholder="optional" onChange={(e) => setSettings({ senderEmail: e.target.value })} /></label>
            <label>Bildgrösse
              <select className="field" value={settings.maxEdge} onChange={(e) => setSettings({ maxEdge: +e.target.value })}>
                <option value={1600}>1600 px, klein</option>
                <option value={2000}>2000 px, empfohlen</option>
                <option value={2560}>2560 px, gross</option>
              </select>
            </label>
          </fieldset>

          <div className="placeholders">
            <span className="muted small">Einfügen:</span>
            {PLACEHOLDERS.map(([ph, label]) => (
              <button key={ph} className="token" title={ph} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(ph)}>{label}</button>
            ))}
          </div>

          <label className="block">Betreff<input className="field" {...bind('subject')} /></label>
          <label className="block">Mailtext<textarea className="field" rows={17} {...bind('body')} /></label>
          <label className="block">LinkedIn-Vorschlag <span className="muted small">landet über {'{post}'} im Mailtext und als eigene Datei</span>
            <textarea className="field" rows={9} {...bind('post')} />
          </label>
          <button className="link-btn" onClick={() => confirm('Texte auf die Vorlage zurücksetzen?') && setTpl(DEFAULT_TPL)}>Texte zurücksetzen</button>
        </div>

        <div className="tpl-preview">
          {recips.length > 1 && (
            <select className="field" value={r?.person.id} onChange={(e) => setPid(e.target.value)}>
              {recips.map((x) => <option key={x.person.id} value={x.person.id}>{x.person.first} {x.person.last}</option>)}
            </select>
          )}
          <div className="preview-bar">
            <span className="muted small">{recips.length ? 'So kommt die Mail an.' : 'Vorschau mit Beispielperson. Sobald jemand markiert ist, erscheint hier die echte Mail.'}</span>
            <div className="seg" role="group" aria-label="Ansicht">
              <button className={mode === 'html' ? 'on' : ''} onClick={() => setMode('html')}>HTML</button>
              <button className={mode === 'text' ? 'on' : ''} onClick={() => setMode('text')}>Text</button>
            </div>
          </div>
          <article className="mail">
            <header>
              <div><span>Von</span>{settings.senderName || '–'}{settings.senderEmail && <em> {settings.senderEmail}</em>}</div>
              <div><span>An</span>{v.name}{person.email && <em> {person.email}</em>}</div>
              <div className="subj">{fill(tpl.subject, v)}</div>
            </header>
            {mode === 'html'
              ? <iframe ref={frame} className="mail-frame" title="Mail-Vorschau" srcDoc={html} onLoad={fit} />
              : <div className="mail-body">{fill(tpl.body, v)}</div>}
            {r && mode === 'text' && (
              <footer>
                {r.photoIds.slice(0, 6).map((id) => <Thumb key={id} id={id} />)}
                {r.photoIds.length > 6 && <span className="more">+{r.photoIds.length - 6}</span>}
              </footer>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
