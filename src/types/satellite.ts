/** One Sentinel-2 acquisition over the region. */
export interface SatelliteObservation {
  /** ISO date, e.g. 2026-10-14 */
  date: string
  platform: string // "Sentinel-2A" | "Sentinel-2B" | "Sentinel-2C"
  processing_level?: string // "L2A"
  tile_id?: string | null // MGRS tile, e.g. "43PFP"
  cloud_cover_pct?: number | null
  product_id?: string | null
}

export interface SatelliteLayerSource {
  id: 'sentinel2_true_color' | 'sentinel2_false_color' | 'ndvi' | 'classification'
  label: string
  /** XYZ tile URL template served by the backend / tile server. */
  tile_url: string
  attribution?: string
  date?: string | null
}

/** Shape returned by GET /api/satellite/availability. */
export interface SatelliteAvailability {
  region_id: string
  observations: SatelliteObservation[]
  latest_observation_date?: string | null
  layers?: SatelliteLayerSource[]
}
