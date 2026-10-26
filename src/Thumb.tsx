import { useImage } from './db'

export function Thumb({ id, className }: { id: string; className?: string }) {
  const url = useImage('t', id)
  return url ? <img className={className} src={url} alt="" loading="lazy" /> : <span className={`ph ${className ?? ''}`} />
}
