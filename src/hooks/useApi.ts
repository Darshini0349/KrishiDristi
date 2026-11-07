import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ApiError, toApiError } from '@/services/api/errors'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error: ApiError | null
}

export interface QueryResult<T> extends AsyncState<T> {
  reload: () => void
}

/**
 * Run a read request and track its loading / error / data state.
 * Re-runs when `deps` change; aborts in-flight requests on change/unmount.
 */
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): QueryResult<T> {
  const { enabled = true } = options
  const [state, setState] = useState<AsyncState<T>>({ status: enabled ? 'loading' : 'idle', data: null, error: null })
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  useLayoutEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', data: null, error: null })
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading', error: null }))
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: null })
      })
      .catch((err: unknown) => {
        const apiErr = toApiError(err)
        if (controller.signal.aborted || apiErr.kind === 'cancelled') return
        setState({ status: 'error', data: null, error: apiErr })
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

export interface MutationResult<TArgs, T> extends AsyncState<T> {
  run: (args: TArgs) => Promise<T | null>
  reset: () => void
}

/** Track a user-triggered write request (e.g. running a classification). */
export function useMutation<TArgs, T>(
  mutate: (args: TArgs, signal: AbortSignal) => Promise<T>,
): MutationResult<TArgs, T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle', data: null, error: null })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (args: TArgs) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setState({ status: 'loading', data: null, error: null })
      try {
        const data = await mutate(args, controller.signal)
        setState({ status: 'success', data, error: null })
        return data
      } catch (err) {
        const apiErr = toApiError(err)
        if (apiErr.kind !== 'cancelled') setState({ status: 'error', data: null, error: apiErr })
        return null
      }
    },
    [mutate],
  )

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setState({ status: 'idle', data: null, error: null })
  }, [])

  return { ...state, run, reset }
}
