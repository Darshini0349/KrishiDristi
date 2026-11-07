import type { ReactNode } from 'react'

interface DashboardCardProps {
  title?: ReactNode
  subtitle?: ReactNode
  /** Right-aligned header content (badges, buttons). */
  actions?: ReactNode
  children: ReactNode
  /** Remove body padding — e.g. for maps and tables that run edge to edge. */
  flush?: boolean
  className?: string
  bodyClassName?: string
}

/** Standard bordered panel used across the dashboard. */
export function DashboardCard({ title, subtitle, actions, children, flush, className = '', bodyClassName = '' }: DashboardCardProps) {
  return (
    <section className={`flex min-w-0 flex-col rounded-lg border border-line bg-panel shadow-panel ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${flush ? '' : 'p-4'} ${bodyClassName}`}>{children}</div>
    </section>
  )
}

interface StatCardProps {
  label: string
  icon?: ReactNode
  /** The value. Pass null when the backend has not provided it. */
  value: ReactNode | null
  /** Shown instead of the value when it is null. */
  unavailableText?: string
  hint?: ReactNode
  loading?: boolean
}

/** KPI tile that never invents a value: null renders an explicit "not available" state. */
export function StatCard({ label, icon, value, unavailableText = 'Data not available', hint, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon && <span className="text-brand-500" aria-hidden="true">{icon}</span>}
      </div>
      <div className="mt-2.5 min-h-[32px]">
        {loading ? (
          <span className="block h-6 w-24 animate-pulse rounded-sm bg-line" aria-label="Loading" />
        ) : value === null || value === undefined ? (
          <span className="text-sm font-medium text-ink-subtle">{unavailableText}</span>
        ) : (
          <span className="text-[22px] leading-8 font-semibold tracking-tight text-ink tabular-nums">{value}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-ink-subtle">{hint}</p>}
    </div>
  )
}
