import { GeoJSON } from 'react-leaflet'
import type { FieldFeature } from '@/types/geo'
import { FIELD_STYLE } from './mapStyles'

/** Read-only rendering of a selected field polygon. */
export function FieldBoundaryLayer({ field }: { field: FieldFeature }) {
  // key forces a re-mount when geometry changes (react-leaflet GeoJSON data is immutable).
  return <GeoJSON key={JSON.stringify(field.geometry.coordinates)} data={field} style={FIELD_STYLE} />
}
