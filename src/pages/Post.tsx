import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'

// Landet man über „Text kopieren“ aus der Mail. Der Text steckt in der URL (Fragment), nichts wird geladen.
function decode(t: string) {
  try {
    const b = atob(t.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)))
  } catch { return '' }
}

export function PostPage() {
  const { t } = useSearch({ from: '/post' })
  const text = decode(t)
  const [done, setDone] = useState(false)

  async function copy() {
    try { await navigator.clipboard.writeText(text) }
    catch {
      const sel = window.getSelection(); const r = document.createRange()
      r.selectNodeContents(document.getElementById('post-text')!); sel?.removeAllRanges(); sel?.addRange(r)
      document.execCommand('copy')
    }
    setDone(true); setTimeout(() => setDone(false), 2500)
  }

  return (
    <div className="postpage">
      <div className="postcard">
        <div className="postcard-head">
          <div className="postcard-avatar">in</div>
          <div><div className="postcard-name">Ihr LinkedIn-Beitrag</div><div className="muted small">Vorschlag, frei anpassbar</div></div>
        </div>
        {text
          ? <div className="postcard-text" id="post-text">{text}</div>
          : <p className="muted">Kein Text in diesem Link.</p>}
        {text && <button className="btn primary postcard-copy" onClick={copy}>{done ? 'Kopiert ✓' : 'Text kopieren'}</button>}
      </div>
      <p className="muted small">Fotodank · Der Text steht nur in diesem Link, nichts wird gespeichert.</p>
    </div>
  )
}
