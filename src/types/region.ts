import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { BBox } from './geo'

export type RegionLevel = 'district' | 'taluk' | 'hobli' | 'village'

/** Shape returned by GET /api/regions (list) and GET /api/regions/{id}. */
export interface Region {
  id: string
  name: string
  level: RegionLevel
  state: string
  parent_id?: string | null
  bbox?: BBox | null
  /** Only on the detail endpoint. */
  boundary?: Feature<Polygon | MultiPolygon> | null
  /** Only populated when backed by real data. */
  area_km2?: number | null
}
