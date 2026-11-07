import { useMemo, useState, type FormEvent } from 'react'
import { Download, Filter, RotateCcw } from 'lucide-react'
import { AsyncContent, DashboardCard, EmptyState, PageHeader, StatCard, StatusBadge } from '@/components/ui'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useClassificationHistory } from '@/hooks/useRegionData'
import { CROP_CATEGORIES, getCrop } from '@/config/crops'
import type { ClassificationRecord, CropType, HistoryQuery } from '@/types/classification'
import { formatDate, formatDateTime, formatHectares, formatNumber, formatPercent, todayIso } from '@/utils/format'
import { downloadTextFile, toCsv } from '@/utils/csv'

interface Filters {
  date_from: string
  date_to: string
  crop_type: '' | CropType
}

const EMPTY_FILTERS: Filters = { date_from: '', date_to: '', crop_type: '' }

function exportCsv(rows: ClassificationRecord[], regionId: string) {
  const csv = toCsv(rows, [
    { header: 'prediction_id', value: (r) => r.prediction_id },
    { header: 'region_id', value: (r) => r.region_id },
    { header: 'status', value: (r) => r.status },
    { header: 'crop_type', value: (r) => r.crop_type ?? '' },
    { header: 'confidence', value: (r) => r.confidence ?? '' },
    { header: 'field_area_ha', value: (r) => r.field_area_ha ?? '' },
    { header: 'observation_date', value: (r) => r.observation_date ?? '' },
    { header: 'model_version', value: (r) => r.model_version ?? '' },
    { header: 'created_at', value: (r) => r.created_at ?? '' },
    { header: 'geometry_geojson', value: (r) => (r.geometry ? JSON.stringify(r.geometry) : '') },
  ])
  downloadTextFile(`krishidrishti_${regionId}_classifications_${todayIso()}.csv`, csv)
}

export default function ReportsPage() {
  const { region } = useWorkspace()
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)

  const query: HistoryQuery = useMemo(
    () => ({
      region_id: region.id,
      ...(applied.date_from && { date_from: applied.date_from }),
      ...(applied.date_to && { date_to: applied.date_to }),
      ...(applied.crop_type && { crop_type: applied.crop_type }),
    }),
    [region.id, applied],
  )
  const history = useClassificationHistory(query)
  const rows = useMemo(() => (history.status === 'success' ? (history.data ?? []) : []), [history.status, history.data])

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.status === 'completed')
    const withConf = completed.filter((r) => typeof r.confidence === 'number')
    const withArea = completed.filter((r) => typeof r.field_area_ha === 'number')
    const byCrop = new Map<string, number>()
    for (const r of completed) if (r.crop_type) byCrop.set(r.crop_type, (byCrop.get(r.crop_type) ?? 0) + 1)
    const top = [...byCrop.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      total: rows.length,
      completed: completed.length,
      meanConfidence: withConf.length ? withConf.reduce((s, r) => s + (r.confidence as number), 0) / withConf.length : null,
      area: withArea.length ? withArea.reduce((s, r) => s + (r.field_area_ha as number), 0) : null,
      top: top ? `${getCrop(top[0]).label} (${top[1]})` : null,
    }
  }, [rows])

  const dateError = draft.date_from && draft.date_to && draft.date_from > draft.date_to ? 'Start date must be before end date.' : null
  const onApply = (e: FormEvent) => {
    e.preventDefault()
    if (!dateError) setApplied(draft)
  }
  const filtersActive = applied.date_from || applied.date_to || applied.crop_type
  const hasData = history.status === 'success'

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Reports"
        title="Classification history"
        description="Previous classification results stored by the backend for this region. Nothing is shown unless it was returned by the API."
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportCsv(rows, region.id)}
            disabled={rows.length === 0}
            title={rows.length === 0 ? 'No results available to export' : `Export ${rows.length} rows as CSV`}
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV{rows.length > 0 && ` (${rows.length})`}
          </button>
        }
      />

      <form onSubmit={onApply} className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4 shadow-panel sm:flex-row sm:flex-wrap sm:items-end" aria-label="Report filters">
        <div className="sm:w-44">
          <label htmlFor="f-from" className="label">From</label>
          <input id="f-from" type="date" className="input" value={draft.date_from} max={draft.date_to || todayIso()} onChange={(e) => setDraft({ ...draft, date_from: e.target.value })} />
        </div>
        <div className="sm:w-44">
          <label htmlFor="f-to" className="label">To</label>
          <input id="f-to" type="date" className="input" value={draft.date_to} min={draft.date_from || undefined} max={todayIso()} onChange={(e) => setDraft({ ...draft, date_to: e.target.value })} />
        </div>
        <div className="sm:w-52">
          <label htmlFor="f-crop" className="label">Crop type</label>
          <select id="f-crop" className="input" value={draft.crop_type} onChange={(e) => setDraft({ ...draft, crop_type: e.target.value as Filters['crop_type'] })}>
            <option value="">All crop types</option>
            {CROP_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={!!dateError}><Filter className="h-4 w-4" aria-hidden="true" /> Apply</button>
          <button type="button" className="btn-ghost" onClick={() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS) }} disabled={!filtersActive && draft === EMPTY_FILTERS}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
          </button>
        </div>
        {dateError && <p className="text-xs text-danger-600 sm:basis-full" role="alert">{dateError}</p>}
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Results" loading={history.status === 'loading'} value={hasData ? formatNumber(stats.total) : null} hint={hasData ? `${stats.completed} completed` : undefined} />
        <StatCard label="Most frequent crop" loading={history.status === 'loading'} value={stats.top} />
        <StatCard label="Mean model confidence" loading={history.status === 'loading'} value={stats.meanConfidence !== null ? formatPercent(stats.meanConfidence) : null} hint={stats.meanConfidence !== null ? 'Over results that report confidence' : undefined} />
        <StatCard label="Classified area" loading={history.status === 'loading'} value={stats.area !== null ? formatHectares(stats.area) : null} />
      </div>

      <DashboardCard flush title="Results" actions={filtersActive ? <StatusBadge tone="info">Filtered</StatusBadge> : undefined}>
        <AsyncContent
          query={history}
          resource="classification history"
          compact={false}
          isEmpty={(d) => d.length === 0}
          empty={
            <EmptyState
              title={filtersActive ? 'No results match these filters' : 'No classification results yet'}
              description={filtersActive ? 'Try widening the date range or choosing a different crop type.' : 'Results appear here after classifications are run and stored by the backend.'}
            />
          }
        >
          {(data) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface text-left text-[11px] tracking-wide text-ink-subtle uppercase">
                    <th scope="col" className="px-4 py-2.5 font-medium">Processed</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Crop</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Confidence</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Area</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Observation</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Model</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.map((r) => {
                    const c = r.crop_type ? getCrop(r.crop_type) : null
                    return (
                      <tr key={r.prediction_id} className="hover:bg-surface">
                        <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">{formatDateTime(r.created_at)}</td>
                        <td className="px-4 py-2.5">{c ? <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-[2px]" style={{ background: c.color }} aria-hidden="true" />{c.label}</span> : '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{typeof r.confidence === 'number' ? formatPercent(r.confidence) : '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatHectares(r.field_area_ha)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(r.observation_date)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.model_version ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge tone={r.status === 'completed' ? 'success' : r.status === 'failed' ? 'danger' : r.status === 'no_data' ? 'warning' : 'info'}>{r.status.replace('_', ' ')}</StatusBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AsyncContent>
      </DashboardCard>
    </div>
  )
}
