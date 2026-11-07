import { useEffect } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import { geoJSON } from 'leaflet'
import type { BoundaryCollection } from '@/types/geo'
import { DISTRICT_APPROX_STYLE, DISTRICT_STYLE } from './mapStyles'
import { BOUNDARY_ATTRIBUTION } from '@/config/map'

interface DistrictBoundaryLayerProps {
  data: BoundaryCollection
  /** Fit the map to the boundary when it first loads. */
  fit?: boolean
}

export function DistrictBoundaryLayer({ data, fit = true }: DistrictBoundaryLayerProps) {
  const map = useMap()
  const approximate = data.features.some((f) => f.properties?.approximate)

  useEffect(() => {
    if (!fit) return
    const bounds = geoJSON(data).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] })
  }, [data, fit, map])

  return (
    <GeoJSON
      key={approximate ? 'approx' : 'official'}
      data={data}
      style={approximate ? DISTRICT_APPROX_STYLE : DISTRICT_STYLE}
      interactive={false}
      attribution={approximate ? undefined : BOUNDARY_ATTRIBUTION}
    />
  )
}
