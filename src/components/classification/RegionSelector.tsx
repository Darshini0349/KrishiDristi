import { MapPinned } from 'lucide-react'
import type { QueryResult } from '@/hooks/useApi'
import type { Region } from '@/types/region'
import { DEFAULT_REGION, type RegionRef } from '@/context/WorkspaceContext'
import { LoadingIndicator, StatusBadge } from '@/components/ui'

interface RegionSelectorProps {
  regions: QueryResult<Region[]>
  value: RegionRef
  onChange: (r: RegionRef) => void
  id?: string
}

/**
 * Region picker. Uses GET /api/regions when available; otherwise offers only
 * the built-in v1 scope (Mysuru district) and says so.
 */
export function RegionSelector({ regions, value, onChange, id = 'region-select' }: RegionSelectorProps) {
  const fromApi = regions.status === 'success' && regions.data && regions.data.length > 0
  const options: RegionRef[] = fromApi
    ? regions.data!.map((r) => ({ id: r.id, name: r.name, level: r.level }))
    : [DEFAULT_REGION]

  return (
    <div>
      <label htmlFor={id} className="label">Region</label>
      <div className="relative">
        <MapPinned className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-600" aria-hidden="true" />
        <select
          id={id}
          className="input appearance-none pl-9"
          value={value.id}
          onChange={(e) => {
            const next = options.find((o) => o.id === e.target.value)
            if (next) onChange(next)
          }}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.level}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-1.5 flex min-h-5 items-center gap-1.5 text-[11px] text-ink-subtle">
        {regions.status === 'loading' ? (
          <LoadingIndicator size="sm" label="Loading regions…" />
        ) : fromApi ? (
          <><StatusBadge tone="success" dot>API</StatusBadge> Regions from backend</>
        ) : (
          <><StatusBadge>Built-in</StatusBadge> v1 scope only — region list unavailable from backend</>
        )}
      </div>
    </div>
  )
}
