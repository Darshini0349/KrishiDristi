import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'

export interface CursorState {
  lat: number
  lng: number
}

/** Reports cursor position, zoom and clicks to the parent component. */
export function MapEventsBridge({
  onCursor,
  onZoom,
  onClick,
}: {
  onCursor?: (c: CursorState | null) => void
  onZoom?: (z: number) => void
  onClick?: (c: CursorState) => void
}) {
  const map = useMapEvents({
    mousemove: (e) => onCursor?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
    mouseout: () => onCursor?.(null),
    zoomend: () => onZoom?.(map.getZoom()),
    click: (e) => onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  useEffect(() => onZoom?.(map.getZoom()), [map, onZoom])
  return null
}

/** Imperatively flies to a target whenever it changes. */
export function FlyTo({ target, zoom = 13 }: { target: LatLngTuple | null; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, zoom, { duration: 0.8 })
  }, [map, target, zoom])
  return null
}

/** Leaflet needs a size recalculation when its container changes size (e.g. responsive panels). */
export function InvalidateOnResize() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [map])
  return null
}
