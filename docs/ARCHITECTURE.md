# Architecture

Sharing is Caring is a static single-page application. There is no server, no database and no account. Everything the app knows lives in the visitor's browser and is gone when they clear site data.

## Stack

- Vite 8, React 19, TypeScript 7.
- TanStack Router with hash history, so the app works from any path, including a GitHub Pages project subfolder, without configuration.
- zustand for state, persisted to `localStorage` (people, tags, templates, settings).
- idb-keyval for binary data in IndexedDB (photo originals, a 1600px view and a 320px thumbnail per photo).
- papaparse for the participant list, fflate for the ZIP.
- Inter Variable, self-hosted through `@fontsource-variable/inter`.

## Source layout

```
src/
  main.tsx            routes: four steps inside the app shell, plus the standalone copy page (/post)
  Layout.tsx          sidebar with the step navigation
  store.ts            zustand store and the recipient derivation
  db.ts               IndexedDB blobs, image resizing, worker pool for export
  resize.worker.ts    OffscreenCanvas resizing off the main thread
  csv.ts              participant list parsing (fuzzy headers, UTF-8 or Windows-1252)
  templates.ts        default texts, placeholders, per-person variable filling
  html.ts             HTML mail body and the LinkedIn-style post card
  eml.ts              MIME assembly for the .eml drafts
  exporter.ts         builds one mail or the whole ZIP
  send.ts             share sheet and mailto paths
  icons.tsx           icon set and logo
  pages/              Import, Tag, Templates, Export, Post
public/
  demo/               generated placeholder photos and an invented participant list
  og.png, logo.svg    social card and logo
```

Content is data, rendering is code: a person is `{ id, first, last, email }`, tags are `photoId → personId[]`, and the recipient list is derived from those two on every render.

## Images

Photos are decoded once on import with `createImageBitmap`. The original is kept as the uploaded file; a view and a thumbnail are resized on a canvas. Export resizes from the original to the chosen edge (1600, 2000 or 2560px) plus a 560px preview for the HTML mail.

Export resizing runs in a pool of Web Workers (up to four, one per CPU core) using OffscreenCanvas. One decode per photo produces both sizes. Browsers without OffscreenCanvas fall back to the main-thread path. The export reports progress with a time estimate and can be cancelled through an AbortSignal.

## The mail

Each draft is a standard RFC 822 message with `X-Unsent: 1`, which classic Outlook for Windows reads as "open as a draft". The MIME tree is:

```
multipart/mixed
  multipart/related
    multipart/alternative
      text/plain
      text/html          the mail with the post card
    image/jpeg (inline)  560px previews, referenced by cid:
  image/jpeg (attached)  full-size photos
```

The HTML is table-based with inline styles because Outlook renders mail with the Word engine. The post card shows the recipient's initials and name, the post text, the photos as the post's media, and a "Text kopieren" link.

## The copy page

Mail clients strip scripts, so a copy button inside a mail cannot work. The link in the card opens `#/post?t=<base64url of the post>` in the app. The text travels in the URL fragment, which browsers never send to a server, and the page offers one clipboard button. The route sits outside the app shell so a recipient sees only the card.

## Sending

See [Sending](SENDING.md) for what each mail client supports and why the app offers three paths.

## Checks

`npm run check` (tsc), `npm run lint` (oxlint), `npm test` (vitest, pure logic only: CSV parser, MIME builder, HTML builder, send module) and `npm run build`. CI runs all four on every push. The deploy workflow builds on push to `main` and publishes `dist/` to GitHub Pages.
