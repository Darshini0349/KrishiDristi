/**
 * Centralised runtime configuration.
 * The API base URL can come from the build-time env (VITE_API_BASE_URL)
 * or be overridden by the user at runtime from the Settings page.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8000'
const API_URL_STORAGE_KEY = 'kd.apiBaseUrl'

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const env = {
  buildApiBaseUrl: (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, ''),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
  appVersion: '0.1.0',
} as const

export function getApiBaseUrl(): string {
  return (readStorage(API_URL_STORAGE_KEY) || env.buildApiBaseUrl).replace(/\/+$/, '')
}

export function hasApiBaseUrlOverride(): boolean {
  return readStorage(API_URL_STORAGE_KEY) !== null
}

export function setApiBaseUrlOverride(url: string | null): void {
  try {
    if (url) window.localStorage.setItem(API_URL_STORAGE_KEY, url.replace(/\/+$/, ''))
    else window.localStorage.removeItem(API_URL_STORAGE_KEY)
  } catch {
    /* storage unavailable — override is not persisted */
  }
}
