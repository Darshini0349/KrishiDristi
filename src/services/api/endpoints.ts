/**
 * Planned FastAPI endpoints. None of these are implemented yet — the UI
 * reports "backend not connected" until a server answers at the base URL.
 */
export const ENDPOINTS = {
  regions: '/api/regions',
  region: (id: string) => `/api/regions/${encodeURIComponent(id)}`,
  satelliteAvailability: '/api/satellite/availability',
  predict: '/api/classification/predict',
  history: '/api/classification/history',
  summary: '/api/classification/summary',
} as const

/** Endpoint used to probe whether the backend is reachable. */
export const HEALTH_PROBE_ENDPOINT = '/api/health'
