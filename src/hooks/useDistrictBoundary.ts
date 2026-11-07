import { useEffect, useState } from 'react'
import { DISTRICT_BOUNDARY_URL, TALUK_BOUNDARY_URL } from '@/config/map'
import type { BoundaryCollection } from '@/types/geo'

export type BoundaryState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: BoundaryCollection; error: null }
  | { status: 'error'; data: null; error: string }

const cache = new Map<string, Promise<BoundaryCollection>>()

function loadBoundary(url: string): Promise<BoundaryCollection> {
  let p = cache.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Boundary file returned ${r.status}`)
        return r.json() as Promise<BoundaryCollection>
      })
      .then((fc) => {
        if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) throw new Error('Boundary file is not a GeoJSON FeatureCollection')
        return fc
      })
      .catch((e) => {
        cache.delete(url)
        throw e
      })
    cache.set(url, p)
  }
  return p
}

/** Loads a static boundary GeoJSON file (shared, cached per URL). */
export function useBoundaryFile(url: string): BoundaryState {
  const [state, setState] = useState<BoundaryState>({ status: 'loading', data: null, error: null })
  useEffect(() => {
    let alive = true
    loadBoundary(url)
      .then((data) => alive && setState({ status: 'success', data, error: null }))
      .catch((e: Error) => alive && setState({ status: 'error', data: null, error: e.message }))
    return () => {
      alive = false
    }
  }, [url])
  return state
}

export const useDistrictBoundary = () => useBoundaryFile(DISTRICT_BOUNDARY_URL)
export const useTalukBoundaries = () => useBoundaryFile(TALUK_BOUNDARY_URL)
