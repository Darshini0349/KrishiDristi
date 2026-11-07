import { useCallback, useState, type ReactNode } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { AlertTriangle } from 'lucide-react'
import { BASE_LAYERS, MYSURU_CENTER, MYSURU_DEFAULT_ZOOM, MYSURU_MAX_BOUNDS } from '@/config/map'
import { useDistrictBoundary, useTalukBoundaries } from '@/hooks/useDistrictBoundary'
import { CoordinateDisplay } from './CoordinateDisplay'
import { DistrictBoundaryLayer } from './DistrictBoundaryLayer'
import { TalukBoundaryLayer } from './TalukBoundaryLayer'
import { InvalidateOnResize, MapEventsBridge, type CursorState } from './MapEvents'
import { MapLegend, type LegendItem } from './MapLegend'

export interface InteractiveMapProps {
  /** Tailwind height classes for the map container. */
  className?: string
  showBaseLayer?: boolean
  showBoundary?: boolean
  /** Taluk (sub-district) outlines with hover names. */
  showTaluks?: boolean
  showCoordinates?: boolean
  fitToBoundary?: boolean
  /** Extra legend entries (district boundary is added automatically). */
  legendItems?: LegendItem[]
  showLegend?: boolean
  onMapClick?: (c: CursorState) => void
  /** Leaflet layers/controls rendered inside the map. */
  children?: ReactNode
  /** HTML overlays positioned over the map (outside Leaflet's event handling). */
  overlay?: ReactNode
  ariaLabel?: string
}

/** Base interactive map of Mysuru district, shared by all map views. */
export function InteractiveMap({
  className = 'h-[420px]',
  showBaseLayer = true,
  showBoundary = true,
  showTaluks = false,
  showCoordinates = true,
  fitToBoundary = true,
  legendItems = [],
  showLegend = true,
  onMapClick,
  children,
  overlay,
  ariaLabel = 'Interactive map of Mysuru district',
}: InteractiveMapProps) {
  const boundary = useDistrictBoundary()
  const taluks = useTalukBoundaries()
  const [cursor, setCursor] = useState<CursorState | null>(null)
  const [zoom, setZoom] = useState<number | null>(null)
  const handleZoom = useCallback((z: number) => setZoom(z), [])

  const approximate = boundary.status === 'success' && boundary.data.features.some((f) => f.properties?.approximate)
  const legend: LegendItem[] = [
    ...(showBoundary && boundary.status === 'success'
      ? [{ label: 'District boundary', color: '#1f4d3a', kind: approximate ? 'dashed' : 'line', note: approximate ? 'approx.' : undefined } as LegendItem]
      : []),
    ...(showTaluks && taluks.status === 'success' ? [{ label: 'Taluk boundary', color: '#4f9070', kind: 'dashed' } as LegendItem] : []),
    ...legendItems,
  ]

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <MapContainer
        center={MYSURU_CENTER}
        zoom={MYSURU_DEFAULT_ZOOM}
        minZoom={7}
        maxBounds={MYSURU_MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        className="h-full w-full"
        aria-label={ariaLabel}
        zoomControl
      >
        {showBaseLayer && (
          <TileLayer url={BASE_LAYERS.osm.url} attribution={BASE_LAYERS.osm.attribution} maxZoom={BASE_LAYERS.osm.maxZoom} />
        )}
        {showTaluks && taluks.status === 'success' && <TalukBoundaryLayer data={taluks.data} />}
        {showBoundary && boundary.status === 'success' && <DistrictBoundaryLayer data={boundary.data} fit={fitToBoundary} />}
        <MapEventsBridge onCursor={setCursor} onZoom={handleZoom} onClick={onMapClick} />
        <InvalidateOnResize />
        {children}
      </MapContainer>

      {/* Overlays sit outside MapContainer so their clicks never reach the map. */}
      <div className="pointer-events-none absolute inset-x-2 bottom-6 z-[500] flex flex-wrap items-end justify-between gap-2">
        {showCoordinates ? <CoordinateDisplay cursor={cursor} zoom={zoom} /> : <span />}
        {showLegend && <MapLegend items={legend} className="pointer-events-auto" />}
      </div>

      {approximate && showBoundary && (
        <div className="pointer-events-none absolute top-2 left-14 z-[500] max-w-[calc(100%-8rem)]">
          <div className="flex items-center gap-1.5 rounded-md border border-[#ecd9a6] bg-warn-50/95 px-2 py-1 text-[11px] text-warn-600 shadow-panel">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Approximate district extent — official boundary pending</span>
          </div>
        </div>
      )}
      {boundary.status === 'error' && showBoundary && (
        <div className="pointer-events-none absolute top-2 left-14 z-[500] rounded-md border border-[#efc6bf] bg-danger-50/95 px-2 py-1 text-[11px] text-danger-600">
          District boundary unavailable: {boundary.error}
        </div>
      )}
      {overlay}
    </div>
  )
}
