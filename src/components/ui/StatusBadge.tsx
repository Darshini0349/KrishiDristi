import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-ink-muted border-line-strong',
  success: 'bg-brand-50 text-brand-700 border-brand-200',
  warning: 'bg-warn-50 text-warn-600 border-[#ecd9a6]',
  danger: 'bg-danger-50 text-danger-600 border-[#efc6bf]',
  info: 'bg-info-50 text-info-600 border-[#c9d8e8]',
  brand: 'bg-brand-700 text-white border-brand-700',
}

const DOTS: Record<BadgeTone, string> = {
  neutral: 'bg-ink-subtle',
  success: 'bg-brand-500',
  warning: 'bg-[#c99a2e]',
  danger: 'bg-danger-600',
  info: 'bg-info-600',
  brand: 'bg-brand-200',
}

interface StatusBadgeProps {
  tone?: BadgeTone
  dot?: boolean
  children: ReactNode
  className?: string
}

export function StatusBadge({ tone = 'neutral', dot = false, children, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONES[tone]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Marks a feature that is visible but intentionally not implemented yet. */
export function NotImplementedBadge({ label = 'Not implemented yet' }: { label?: string }) {
  return <StatusBadge tone="neutral">{label}</StatusBadge>
}
