import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

/** A user-selected field boundary. Coordinates are GeoJSON [lng, lat]. */
export type FieldFeature = Feature<Polygon, { source: 'drawn' | 'uploaded' | 'api'; id?: string }>

export interface BoundaryProperties {
  name: string
  admin_level?: string
  state?: string
  /** Where the geometry came from (e.g. "Survey of India", "KSRSAC"). */
  source: string
  /** True when the geometry is a placeholder approximation, not an official boundary. */
  approximate: boolean
}

export type BoundaryCollection = FeatureCollection<Polygon | MultiPolygon, BoundaryProperties>

/** [minLng, minLat, maxLng, maxLat] — GeoJSON bbox order. */
export type BBox = [number, number, number, number]
