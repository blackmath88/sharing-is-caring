# Fotodank

Event-Fotos an Teilnehmende verschicken: Fotos und Teilnehmerliste importieren, Personen auf den Bildern markieren, Mailtext und LinkedIn-Vorschlag schreiben, ZIP mit fertigen Mail-Entwürfen exportieren.

Alles läuft im Browser. Fotos liegen in IndexedDB, Markierungen und Vorlagen in localStorage. Nichts wird hochgeladen.

## Lokal

```bash
npm install
npm run dev
```

## Deploy

Repo pushen, dann unter **Settings → Pages → Source: GitHub Actions** wählen. Jeder Push auf `main` deployt.

## Export

Pro Person ein Ordner mit:

- `Mail_….eml`: Entwurf mit Bildern im Anhang. In Outlook (Windows) öffnet er per Doppelklick als sendebereiter Entwurf (`X-Unsent: 1`). Andere Clients zeigen ihn teils als empfangene Mail.
- `LinkedIn-Post.txt`
- die Fotos (verkleinert), als Fallback zum manuellen Anhängen

Dazu `Uebersicht.csv` für Excel.

## Teilnehmerliste

CSV mit Spalten wie `Vorname`, `Nachname`, `E-Mail` (oder `Name` als ganzer Name). Komma oder Semikolon, UTF-8 oder Excel-Encoding. Excel-Dateien vorher als CSV speichern.
