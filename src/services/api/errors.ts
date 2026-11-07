import axios from 'axios'

export type ApiErrorKind =
  /** Backend unreachable (not running, CORS, DNS). Expected during frontend-only development. */
  | 'offline'
  | 'timeout'
  /** Endpoint exists conceptually but the server returned 404 — not implemented yet. */
  | 'not_found'
  | 'http'
  | 'cancelled'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly endpoint?: string

  constructor(kind: ApiErrorKind, message: string, opts: { status?: number; endpoint?: string } = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = opts.status
    this.endpoint = opts.endpoint
  }
}

/** Convert anything thrown by axios into a typed ApiError. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (axios.isCancel(err)) return new ApiError('cancelled', 'Request cancelled')
  if (axios.isAxiosError(err)) {
    const endpoint = err.config?.url
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new ApiError('timeout', 'The backend did not respond in time.', { endpoint })
    }
    if (!err.response) {
      return new ApiError('offline', 'The KrishiDrishti backend is not reachable.', { endpoint })
    }
    const status = err.response.status
    const detail = (err.response.data as { detail?: unknown } | undefined)?.detail
    const message = typeof detail === 'string' ? detail : `Request failed with status ${status}.`
    if (status === 404) return new ApiError('not_found', message, { status, endpoint })
    return new ApiError('http', message, { status, endpoint })
  }
  return new ApiError('unknown', err instanceof Error ? err.message : 'Unexpected error')
}
