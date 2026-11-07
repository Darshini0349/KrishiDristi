import { CalendarDays, CloudSun, Info } from 'lucide-react'
import type { QueryResult } from '@/hooks/useApi'
import type { SatelliteAvailability } from '@/types/satellite'
import { LoadingIndicator } from '@/components/ui'
import { formatDate, todayIso } from '@/utils/format'

/** Sentinel-2A launch; no imagery exists before this date. */
const SENTINEL2_START = '2015-06-23'

interface DateSelectorProps {
  availability: QueryResult<SatelliteAvailability>
  value: string | null
  onChange: (date: string | null) => void
  id?: string
}

/**
 * Observation date picker. When the backend reports real acquisitions, only
 * those dates are selectable. Otherwise a manual date is allowed and is
 * clearly marked as unverified.
 */
export function DateSelector({ availability, value, onChange, id = 'obs-date' }: DateSelectorProps) {
  if (availability.status === 'loading') return <LoadingIndicator size="sm" label="Checking Sentinel-2 availability…" />

  const observations = availability.status === 'success' ? (availability.data?.observations ?? []) : []
  const sorted = [...observations].sort((a, b) => b.date.localeCompare(a.date))

  if (availability.status === 'success' && sorted.length > 0) {
    return (
      <fieldset>
        <legend className="label">Satellite observation</legend>
        <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {sorted.map((o) => {
            const selected = value === o.date
            return (
              <li key={`${o.date}-${o.product_id ?? o.platform}`}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${selected ? 'border-brand-500 bg-brand-50' : 'border-line hover:bg-surface'}`}>
                  <input type="radio" name={id} className="accent-brand-700" checked={selected} onChange={() => onChange(o.date)} />
                  <span className="font-medium tabular-nums">{formatDate(o.date)}</span>
                  <span className="min-w-0 truncate font-mono text-[11px] text-ink-subtle" title={o.platform}>{o.tile_id ?? o.platform}</span>
                  {typeof o.cloud_cover_pct === 'number' && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-muted">
                      <CloudSun className="h-3 w-3" aria-hidden="true" /> {o.cloud_cover_pct.toFixed(0)}%
                    </span>
                  )}
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>
    )
  }

  // No verified availability — manual entry, explicitly unverified.
  const reason =
    availability.status === 'error'
      ? 'Imagery availability could not be checked because the backend is not connected.'
      : 'The backend reported no Sentinel-2 acquisitions for this region.'

  return (
    <div>
      <label htmlFor={id} className="label">Satellite observation date</label>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-600" aria-hidden="true" />
        <input
          id={id}
          type="date"
          className="input pl-9"
          min={SENTINEL2_START}
          max={todayIso()}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-describedby={`${id}-note`}
        />
      </div>
      <p id={`${id}-note`} className="mt-1.5 flex gap-1.5 text-[11px] leading-snug text-warn-600">
        <Info className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{reason} The date you enter is unverified; the backend will confirm whether imagery exists.</span>
      </p>
    </div>
  )
}
