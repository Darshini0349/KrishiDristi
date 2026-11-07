import { useEffect, useState } from 'react'
import { DISTRICT_BOUNDARY_URL } from '@/config/map'
import type { BoundaryCollection } from '@/types/geo'

type BoundaryState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: BoundaryCollection; error: null }
  | { status: 'error'; data: null; error: string }

let cache: Promise<BoundaryCollection> | null = null

function loadBoundary(): Promise<BoundaryCollection> {
  cache ??= fetch(DISTRICT_BOUNDARY_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Boundary file returned ${r.status}`)
      return r.json() as Promise<BoundaryCollection>
    })
    .then((fc) => {
      if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) throw new Error('Boundary file is not a GeoJSON FeatureCollection')
      return fc
    })
    .catch((e) => {
      cache = null
      throw e
    })
  return cache
}

/** Loads the static district boundary GeoJSON (shared, cached). */
export function useDistrictBoundary(): BoundaryState {
  const [state, setState] = useState<BoundaryState>({ status: 'loading', data: null, error: null })
  useEffect(() => {
    let alive = true
    loadBoundary()
      .then((data) => alive && setState({ status: 'success', data, error: null }))
      .catch((e: Error) => alive && setState({ status: 'error', data: null, error: e.message }))
    return () => {
      alive = false
    }
  }, [])
  return state
}
