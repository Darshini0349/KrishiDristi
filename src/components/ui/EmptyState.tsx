import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ title, description, icon, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-1.5 px-4 py-6' : 'gap-2 px-6 py-10'}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink-subtle" aria-hidden="true">
        {icon ?? <Inbox className="h-4 w-4" />}
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
