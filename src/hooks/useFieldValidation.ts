import { useMemo } from 'react'
import type { FieldFeature } from '@/types/geo'
import { m2ToHectares, pointInPolygon, polygonArea, polygonCentroid } from '@/utils/geo'
import { useDistrictBoundary, useTalukBoundaries } from './useDistrictBoundary'

const MAX_FIELD_HA = 500

/** Client-side checks on a selected field: area and location within the district. */
export function useFieldValidation(field: FieldFeature | null) {
  const boundary = useDistrictBoundary()
  const taluks = useTalukBoundaries()
  const taluk = useMemo(() => {
    if (!field || taluks.status !== 'success') return null
    const c = polygonCentroid(field.geometry)
    return taluks.data.features.find((f) => pointInPolygon(c, f.geometry))?.properties?.name ?? null
  }, [field, taluks])
  const result = useMemo(() => {
    if (!field) return { areaHa: null, warning: null, blocking: false }
    const areaHa = m2ToHectares(polygonArea(field.geometry))
    if (areaHa <= 0) return { areaHa, warning: 'The field polygon has no area.', blocking: true }
    if (boundary.status === 'success') {
      const centroid = polygonCentroid(field.geometry)
      const inside = boundary.data.features.some((f) => pointInPolygon(centroid, f.geometry))
      const approx = boundary.data.features.some((f) => f.properties?.approximate)
      if (!inside) {
        return {
          areaHa,
          warning: approx
            ? 'This field appears to be outside the approximate Mysuru district extent. The official boundary may differ.'
            : 'This field is outside Mysuru district — the current model scope.',
          blocking: !approx,
        }
      }
    }
    if (areaHa > MAX_FIELD_HA) {
      return { areaHa, warning: `This polygon covers ${areaHa.toFixed(0)} ha — larger than a typical field. Results describe the dominant crop only.`, blocking: false }
    }
    return { areaHa, warning: null, blocking: false }
  }, [field, boundary])
  return { ...result, taluk }
}
