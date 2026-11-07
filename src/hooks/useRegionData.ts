import { useApi } from './useApi'
import { fetchRegions } from '@/services/regions'
import { fetchSatelliteAvailability } from '@/services/satellite'
import { fetchClassificationHistory, fetchClassificationSummary } from '@/services/classification'
import type { HistoryQuery } from '@/types/classification'

/** Thin, named wrappers so pages read declaratively. */
export function useRegions() {
  return useApi((signal) => fetchRegions(signal), [])
}

export function useSatelliteAvailability(regionId: string, layerDate?: string | null) {
  return useApi(
    (signal) => fetchSatelliteAvailability({ region_id: regionId, ...(layerDate ? { layer_date: layerDate } : {}) }, signal),
    [regionId, layerDate ?? null],
  )
}

export function useClassificationSummary(regionId: string) {
  return useApi((signal) => fetchClassificationSummary(regionId, signal), [regionId])
}

export function useClassificationHistory(query: HistoryQuery) {
  const key = JSON.stringify(query)
  return useApi((signal) => fetchClassificationHistory(query, signal), [key])
}
