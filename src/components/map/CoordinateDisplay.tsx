import { Crosshair } from 'lucide-react'
import { formatCoord } from '@/utils/format'
import type { CursorState } from './MapEvents'

interface CoordinateDisplayProps {
  cursor: CursorState | null
  zoom: number | null
  className?: string
}

/** Live WGS84 cursor coordinates and zoom level. */
export function CoordinateDisplay({ cursor, zoom, className = '' }: CoordinateDisplayProps) {
  return (
    <div className={`pointer-events-none flex items-center gap-2 rounded-md border border-line bg-panel/95 px-2.5 py-1.5 font-mono text-[11px] text-ink-muted shadow-panel ${className}`} aria-live="off">
      <Crosshair className="h-3 w-3 text-brand-500" aria-hidden="true" />
      {cursor ? (
        <span className="tabular-nums">
          {formatCoord(cursor.lat, 'lat')} · {formatCoord(cursor.lng, 'lng')}
        </span>
      ) : (
        <span>Move cursor over map</span>
      )}
      {zoom !== null && <span className="border-l border-line pl-2">z{zoom}</span>}
      <span className="hidden border-l border-line pl-2 sm:inline">WGS84</span>
    </div>
  )
}
