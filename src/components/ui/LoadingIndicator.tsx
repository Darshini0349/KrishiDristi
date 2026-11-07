import { Loader2 } from 'lucide-react'

interface LoadingIndicatorProps {
  label?: string
  /** Fills the parent and centres the indicator. */
  block?: boolean
  size?: 'sm' | 'md'
}

export function LoadingIndicator({ label = 'Loading…', block = false, size = 'md' }: LoadingIndicatorProps) {
  const content = (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <Loader2 className={`animate-spin text-brand-500 ${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} aria-hidden="true" />
      {label}
    </span>
  )
  if (!block) return content
  return <div className="flex h-full min-h-[120px] w-full items-center justify-center p-6">{content}</div>
}
