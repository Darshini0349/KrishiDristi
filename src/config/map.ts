import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet'

/**
 * Map configuration for the initial geographical scope: Mysuru district.
 * Coordinates here are Leaflet [lat, lng]; all GeoJSON data stays [lng, lat].
 */
export const MYSURU_CENTER: LatLngTuple = [12.24, 76.5]
export const MYSURU_DEFAULT_ZOOM = 9

/** Generous viewing extent around the district (south-west, north-east). */
export const MYSURU_MAX_BOUNDS: LatLngBoundsExpression = [
  [11.2, 75.4],
  [13.3, 77.6],
]

/** Static boundary file. Replace with the official boundary when provided. */
export const DISTRICT_BOUNDARY_URL = '/data/mysuru-boundary.geojson'

export const BASE_LAYERS = {
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
} as const

/**
 * Taluk headquarters towns for navigation/search only.
 * Approximate town-centre coordinates — NOT administrative boundaries.
 */
export const TALUK_HEADQUARTERS: { name: string; lat: number; lng: number }[] = [
  { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Nanjangud', lat: 12.12, lng: 76.68 },
  { name: 'T. Narasipura', lat: 12.21, lng: 76.9 },
  { name: 'H.D. Kote', lat: 12.09, lng: 76.33 },
  { name: 'Hunsur', lat: 12.31, lng: 76.29 },
  { name: 'Periyapatna', lat: 12.34, lng: 76.1 },
  { name: 'K.R. Nagar', lat: 12.44, lng: 76.38 },
]
