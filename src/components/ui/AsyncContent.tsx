import type { ReactNode } from 'react'
import type { QueryResult } from '@/hooks/useApi'
import { LoadingIndicator } from './LoadingIndicator'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

interface AsyncContentProps<T> {
  query: QueryResult<T>
  resource: string
  /** Return true when the successful response contains nothing to show. */
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  loadingLabel?: string
  compact?: boolean
  children: (data: T) => ReactNode
}

/** Renders the right loading / error / empty / content state for a query. */
export function AsyncContent<T>({ query, resource, isEmpty, empty, loadingLabel, compact = true, children }: AsyncContentProps<T>) {
  if (query.status === 'loading' || query.status === 'idle') return <LoadingIndicator block label={loadingLabel ?? `Loading ${resource}…`} />
  if (query.status === 'error' && query.error) return <ErrorState error={query.error} resource={resource} onRetry={query.reload} compact={compact} />
  if (query.data === null || (isEmpty && isEmpty(query.data))) {
    return <>{empty ?? <EmptyState compact={compact} title="No data yet" description={`The backend returned no ${resource}.`} />}</>
  }
  return <>{children(query.data)}</>
}
