import type { SatelliteAvailability } from '@/types/satellite'
import { apiGet } from './api/client'
import { ENDPOINTS } from './api/endpoints'

export interface AvailabilityQuery {
  region_id: string
  date_from?: string
  date_to?: string
  max_cloud_pct?: number
  /** Build imagery map layers for this date (default: latest observation). */
  layer_date?: string
}

export function fetchSatelliteAvailability(params: AvailabilityQuery, signal?: AbortSignal) {
  return apiGet<SatelliteAvailability>(ENDPOINTS.satelliteAvailability, { params, signal })
}
