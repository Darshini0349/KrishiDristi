import { useEffect, useLayoutEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from '@/lib/leaflet'
import 'leaflet-draw'
import type { Polygon } from 'geojson'
import type { FieldFeature } from '@/types/geo'
import { closeRing } from '@/utils/geo'
import { FIELD_STYLE } from './mapStyles'

interface FieldSelectorProps {
  value: FieldFeature | null
  onChange: (field: FieldFeature | null) => void
  /** Hide the draw toolbar (e.g. while a request is running). */
  disabled?: boolean
}

function layerToField(layer: L.Layer): FieldFeature | null {
  const gj = (layer as L.Polygon).toGeoJSON() as GeoJSON.Feature<Polygon>
  if (gj.geometry?.type !== 'Polygon') return null
  return {
    type: 'Feature',
    properties: { source: 'drawn' },
    geometry: { type: 'Polygon', coordinates: gj.geometry.coordinates.map(closeRing) },
  }
}

/**
 * Field boundary selection with Leaflet.draw.
 * Supports one field at a time: polygon or rectangle, editable and deletable.
 * Emits GeoJSON in [lng, lat] order.
 */
export function FieldSelector({ value, onChange, disabled = false }: FieldSelectorProps) {
  const map = useMap()
  const groupRef = useRef<L.FeatureGroup>(new L.FeatureGroup())
  const onChangeRef = useRef(onChange)
  useLayoutEffect(() => {
    onChangeRef.current = onChange
  })

  // Feature group + draw events
  useEffect(() => {
    const group = groupRef.current
    map.addLayer(group)

    const created = (e: L.LeafletEvent) => {
      const layer = (e as L.DrawEvents.Created).layer
      group.clearLayers()
      onChangeRef.current(layerToField(layer))
    }
    const edited = () => {
      const layer = group.getLayers()[0]
      onChangeRef.current(layer ? layerToField(layer) : null)
    }
    const deleted = () => {
      if (group.getLayers().length === 0) onChangeRef.current(null)
    }

    map.on(L.Draw.Event.CREATED, created)
    map.on(L.Draw.Event.EDITED, edited)
    map.on(L.Draw.Event.DELETED, deleted)
    return () => {
      map.off(L.Draw.Event.CREATED, created)
      map.off(L.Draw.Event.EDITED, edited)
      map.off(L.Draw.Event.DELETED, deleted)
      map.removeLayer(group)
    }
  }, [map])

  // Draw toolbar
  useEffect(() => {
    if (disabled) return
    const shape = { shapeOptions: FIELD_STYLE, showArea: false }
    const control = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { ...shape, allowIntersection: false, showArea: false },
        rectangle: shape as L.DrawOptions.RectangleOptions,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: { featureGroup: groupRef.current, remove: true },
    })
    map.addControl(control)
    return () => {
      map.removeControl(control)
    }
  }, [map, disabled])

  // Keep the drawn layer in sync with the controlled value
  useEffect(() => {
    const group = groupRef.current
    const current = group.getLayers()[0] as L.Polygon | undefined
    const currentJson = current ? JSON.stringify(layerToField(current)?.geometry.coordinates) : null
    const nextJson = value ? JSON.stringify(value.geometry.coordinates) : null
    if (currentJson === nextJson) return
    group.clearLayers()
    if (value) {
      L.geoJSON(value, { style: FIELD_STYLE }).eachLayer((l) => group.addLayer(l))
    }
  }, [value])

  return null
}
