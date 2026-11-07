import type { MultiPolygon, Polygon, Position } from 'geojson'
import type { LatLngTuple } from 'leaflet'
import type { BBox } from '@/types/geo'

/**
 * Geometry helpers. All inputs are GeoJSON positions: [lng, lat].
 * Conversion to Leaflet's [lat, lng] happens ONLY via these helpers.
 */
const EARTH_RADIUS_M = 6378137
const toRad = (d: number) => (d * Math.PI) / 180

export function toLatLng([lng, lat]: Position): LatLngTuple {
  return [lat, lng]
}

export function toPosition(lat: number, lng: number): Position {
  return [lng, lat]
}

/** Geodesic area of a linear ring in m² (spherical approximation, as used by Leaflet.draw). */
export function ringArea(ring: Position[]): number {
  if (ring.length < 3) return 0
  let area = 0
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i]
    const [lng2, lat2] = ring[(i + 1) % ring.length]
    area += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)))
  }
  return Math.abs((area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2)
}

/** Polygon area in m², subtracting holes. */
export function polygonArea(polygon: Polygon): number {
  const [outer, ...holes] = polygon.coordinates
  return Math.max(0, ringArea(outer) - holes.reduce((s, h) => s + ringArea(h), 0))
}

export const m2ToHectares = (m2: number) => m2 / 10_000

/** Ensure a ring is closed (first === last), as required by RFC 7946. */
export function closeRing(ring: Position[]): Position[] {
  if (ring.length === 0) return ring
  const [f, l] = [ring[0], ring[ring.length - 1]]
  return f[0] === l[0] && f[1] === l[1] ? ring : [...ring, f]
}

export function polygonCentroid(polygon: Polygon): Position {
  const ring = polygon.coordinates[0]
  const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring
  const [sx, sy] = pts.reduce(([x, y], [lng, lat]) => [x + lng, y + lat], [0, 0])
  return [sx / pts.length, sy / pts.length]
}

function pointInRing([x, y]: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function pointInPolygon(point: Position, geom: Polygon | MultiPolygon): boolean {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  return polys.some(([outer, ...holes]) => pointInRing(point, outer) && !holes.some((h) => pointInRing(point, h)))
}

export function polygonBBox(polygon: Polygon): BBox {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [x, y] of polygon.coordinates[0]) {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  return [minX, minY, maxX, maxY]
}

/** Parse "12.30, 76.64" (lat, lng) into a GeoJSON position, or null. */
export function parseLatLngInput(input: string): Position | null {
  const m = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return [lng, lat]
}
