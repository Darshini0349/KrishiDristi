import type { Region } from '@/types/region'
import { apiGet } from './api/client'
import { ENDPOINTS } from './api/endpoints'

export function fetchRegions(signal?: AbortSignal) {
  return apiGet<Region[]>(ENDPOINTS.regions, { signal })
}

export function fetchRegion(id: string, signal?: AbortSignal) {
  return apiGet<Region>(ENDPOINTS.region(id), { signal })
}
