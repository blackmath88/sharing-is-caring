// Eigene Icons: 24er Raster, Strich 1.75, currentColor. Logo: zwei Fotos, eines geteilt, mit Herz.
type P = { size?: number; className?: string }
const Svg = ({ size = 18, className, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{children}</svg>
)

export const IconUpload = (p: P) => <Svg {...p}><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15.5v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" /></Svg>
export const IconTag = (p: P) => <Svg {...p}><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20c0-3.6 2.9-6 6.5-6 1.2 0 2.3.3 3.2.7" /><path d="m14.5 17.5 2 2 4-4.5" /></Svg>
export const IconText = (p: P) => <Svg {...p}><path d="M5 6.5h14M5 11h14M5 15.5h9M5 20h5" /></Svg>
export const IconSend = (p: P) => <Svg {...p}><path d="M20.5 3.5 10.5 13.5" /><path d="M20.5 3.5 14 20.5l-3.5-7-7-3.5z" /></Svg>
export const IconPhoto = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="10" r="1.6" /><path d="M21 16.5 16 11.5l-7 7" /></Svg>
export const IconList = (p: P) => <Svg {...p}><path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" strokeWidth={2.6} /><path d="M9 7h11M9 12h11M9 17h11" /></Svg>
export const IconCheck = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>
export const IconHeart = (p: P) => <Svg {...p}><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z" /></Svg>
export const IconGitHub = (p: P) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={p.className}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

// Logo: hinteres Foto leicht gedreht, vorderes mit Herz. Farben über CSS-Variablen, damit Dark Mode passt.
export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="3" y="8" width="18" height="18" rx="5" fill="var(--accent-soft)" transform="rotate(-12 12 17)" />
    <rect x="10.5" y="5.5" width="19" height="19" rx="5.5" fill="var(--accent)" />
    <path d="M20 20.3 16.2 16.6a2.45 2.45 0 0 1 3.47-3.47l.33.33.33-.33a2.45 2.45 0 0 1 3.47 3.47z" fill="#fff" />
  </svg>
)
