import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '@/services/api/client'
import { HEALTH_PROBE_ENDPOINT } from '@/services/api/endpoints'
import { getApiBaseUrl } from '@/config/env'
import type { ApiError } from '@/services/api/errors'

export type BackendState = 'checking' | 'online' | 'offline'

interface BackendStatusValue {
  state: BackendState
  baseUrl: string
  lastCheckedAt: Date | null
  lastError: ApiError | null
  recheck: () => void
}

const BackendStatusContext = createContext<BackendStatusValue | null>(null)

/** Probes the FastAPI backend once on load and on demand. */
export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BackendState>('checking')
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)
  const [lastError, setLastError] = useState<ApiError | null>(null)
  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl())
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState('checking')
    setBaseUrl(getApiBaseUrl())
    apiClient
      .get(HEALTH_PROBE_ENDPOINT, { signal: controller.signal, timeout: 5000 })
      .then(() => {
        setState('online')
        setLastError(null)
      })
      .catch((err: ApiError) => {
        if (err.kind === 'cancelled') return
        // Any HTTP response (even 4xx/5xx) proves the server is reachable.
        const reachable = err.kind === 'http' || err.kind === 'not_found'
        setState(reachable ? 'online' : 'offline')
        setLastError(err)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLastCheckedAt(new Date())
      })
    return () => controller.abort()
  }, [nonce])

  const recheck = useCallback(() => setNonce((n) => n + 1), [])

  return (
    <BackendStatusContext.Provider value={{ state, baseUrl, lastCheckedAt, lastError, recheck }}>
      {children}
    </BackendStatusContext.Provider>
  )
}

export function useBackendStatus() {
  const ctx = useContext(BackendStatusContext)
  if (!ctx) throw new Error('useBackendStatus must be used inside BackendStatusProvider')
  return ctx
}
