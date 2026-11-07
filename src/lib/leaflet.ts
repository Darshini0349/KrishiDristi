import L from 'leaflet'

/**
 * leaflet-draw is a legacy plugin that extends the global `L`.
 * Importing this module first guarantees the global exists before it loads.
 */
declare global {
  interface Window {
    L: typeof L
  }
}
window.L = L

export default L
