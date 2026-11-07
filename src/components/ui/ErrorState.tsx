import { AlertTriangle, PlugZap, RotateCw } from 'lucide-react'
import type { ApiError } from '@/services/api/errors'
import { getApiBaseUrl } from '@/config/env'

interface ErrorStateProps {
  error: ApiError | Error | string
  /** What was being loaded, e.g. "classification history". */
  resource?: string
  onRetry?: () => void
  compact?: boolean
}

function describe(error: ErrorStateProps['error'], resource?: string) {
  const what = resource ?? 'this data'
  if (typeof error === 'string') return { offline: false, title: `Could not load ${what}`, body: error }
  const kind = 'kind' in error ? error.kind : 'unknown'
  switch (kind) {
    case 'offline':
      return {
        offline: true,
        title: 'Backend not connected',
        body: `The FastAPI service at ${getApiBaseUrl()} is not reachable, so ${what} cannot be shown. This is expected while the backend is still in development.`,
      }
    case 'timeout':
      return { offline: false, title: 'Request timed out', body: `The backend took too long to return ${what}.` }
    case 'not_found':
      return { offline: false, title: 'Endpoint not available', body: `The backend responded, but the endpoint for ${what} is not implemented yet (404).` }
    default:
      return { offline: false, title: `Could not load ${what}`, body: error.message }
  }
}

export function ErrorState({ error, resource, onRetry, compact = false }: ErrorStateProps) {
  const { offline, title, body } = describe(error, resource)
  const Icon = offline ? PlugZap : AlertTriangle
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-1.5 px-4 py-6' : 'gap-2 px-6 py-10'}`}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-md border ${offline ? 'border-line bg-surface text-ink-muted' : 'border-[#efc6bf] bg-danger-50 text-danger-600'}`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-ink-muted">{body}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-2 py-1.5 text-xs">
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  )
}
