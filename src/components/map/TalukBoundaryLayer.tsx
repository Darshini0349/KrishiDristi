import { GeoJSON } from 'react-leaflet'
import type { Layer } from 'leaflet'
import type { Feature } from 'geojson'
import type { BoundaryCollection } from '@/types/geo'
import { BOUNDARY_ATTRIBUTION } from '@/config/map'
import { TALUK_STYLE } from './mapStyles'

/** Taluk (sub-district) outlines with a name tooltip on hover. */
export function TalukBoundaryLayer({ data }: { data: BoundaryCollection }) {
  const onEach = (feature: Feature, layer: Layer) => {
    const name = (feature.properties as { name?: string } | null)?.name
    if (name) layer.bindTooltip(`${name} taluk`, { sticky: true, className: 'kd-tooltip', direction: 'top' })
  }
  return <GeoJSON data={data} style={TALUK_STYLE} onEachFeature={onEach} attribution={BOUNDARY_ATTRIBUTION} />
}
