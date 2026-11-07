export interface LegendItem {
  label: string
  color: string
  /** fill = solid swatch, line = solid outline, dashed = dashed outline */
  kind?: 'fill' | 'line' | 'dashed'
  note?: string
}

interface MapLegendProps {
  title?: string
  items: LegendItem[]
  className?: string
}

export function MapLegend({ title = 'Legend', items, className = '' }: MapLegendProps) {
  if (items.length === 0) return null
  return (
    <div className={`rounded-md border border-line bg-panel/95 px-3 py-2.5 shadow-panel ${className}`} role="group" aria-label={title}>
      <p className="mb-1.5 font-mono text-[10px] tracking-[0.12em] text-ink-subtle uppercase">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-ink">
            <Swatch color={item.color} kind={item.kind ?? 'fill'} />
            <span>{item.label}</span>
            {item.note && <span className="text-[10px] text-ink-subtle">{item.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Swatch({ color, kind }: { color: string; kind: 'fill' | 'line' | 'dashed' }) {
  if (kind === 'fill') return <span className="h-2.5 w-3.5 rounded-[2px]" style={{ background: color }} aria-hidden="true" />
  return (
    <span
      className="h-2.5 w-3.5 rounded-[2px] border-2"
      style={{ borderColor: color, borderStyle: kind === 'dashed' ? 'dashed' : 'solid' }}
      aria-hidden="true"
    />
  )
}
