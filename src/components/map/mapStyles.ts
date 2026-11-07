import type { PathOptions } from 'leaflet'

export const DISTRICT_STYLE: PathOptions = {
  color: '#1f4d3a',
  weight: 2,
  opacity: 0.9,
  fillColor: '#2f7454',
  fillOpacity: 0.05,
}

export const DISTRICT_APPROX_STYLE: PathOptions = { ...DISTRICT_STYLE, dashArray: '6 5' }

export const TALUK_STYLE: PathOptions = {
  color: '#4f9070',
  weight: 1,
  opacity: 0.9,
  dashArray: '3 3',
  fillColor: '#4f9070',
  fillOpacity: 0,
}

export const FIELD_STYLE: PathOptions = {
  color: '#d97a1b',
  weight: 2.5,
  opacity: 1,
  fillColor: '#f0a24a',
  fillOpacity: 0.22,
}
