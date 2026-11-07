import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, Grid3x3, Layers3, MapPinned, Ruler, ScanSearch } from 'lucide-react'
import { AsyncContent, DashboardCard, EmptyState, PageHeader, StatCard, StatusBadge, type BadgeTone } from '@/components/ui'
import { FieldBoundaryLayer, InteractiveMap } from '@/components/map'
import { CropDistributionChart } from '@/components/charts/CropDistributionChart'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useBackendStatus } from '@/context/BackendStatusContext'
import { useClassificationHistory, useClassificationSummary, useSatelliteAvailability } from '@/hooks/useRegionData'
import { useDistrictBoundary } from '@/hooks/useDistrictBoundary'
import { getCrop } from '@/config/crops'
import { formatDate, formatDateTime, formatHectares, formatNumber, formatPercent } from '@/utils/format'

function StatusRow({ label, tone, value, detail }: { label: string; tone: BadgeTone; value: string; detail?: ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {detail && <p className="mt-0.5 text-[11px] leading-snug text-ink-subtle">{detail}</p>}
      </div>
      <StatusBadge tone={tone} dot>{value}</StatusBadge>
    </li>
  )
}

export default function OverviewPage() {
  const { region, field } = useWorkspace()
  const backend = useBackendStatus()
  const summary = useClassificationSummary(region.id)
  const availability = useSatelliteAvailability(region.id)
  const history = useClassificationHistory({ region_id: region.id, limit: 6 })
  const boundary = useDistrictBoundary()

  const s = summary.status === 'success' ? summary.data : null
  const latestObs = s?.latest_observation_date ?? (availability.status === 'success' ? availability.data?.latest_observation_date : null) ?? null
  const cropsDetected = s ? s.distribution.filter((d) => d.field_count > 0).length : null
  const loadingSummary = summary.status === 'loading'
  const boundaryProps = boundary.status === 'success' ? boundary.data.features[0]?.properties : null

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Overview"
        title={region.name}
        description="Satellite-based crop type classification status for the selected region. Figures appear only when returned by the backend."
        actions={
          <Link to="/app/classify" className="btn-primary">
            <ScanSearch className="h-4 w-4" aria-hidden="true" /> New classification
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5 [&>*:first-child]:col-span-2 xl:[&>*:first-child]:col-span-1">
        <StatCard label="Selected area" icon={<MapPinned className="h-4 w-4" />} value={region.name} hint="Karnataka, India · v1 scope" />
        <StatCard
          label="Total monitored area"
          icon={<Ruler className="h-4 w-4" />}
          loading={loadingSummary}
          value={s?.total_area_ha != null ? formatHectares(s.total_area_ha) : null}
          hint={s ? 'From classification summary' : undefined}
        />
        <StatCard
          label="Classified fields"
          icon={<Grid3x3 className="h-4 w-4" />}
          loading={loadingSummary}
          value={s?.classified_fields != null ? formatNumber(s.classified_fields) : null}
        />
        <StatCard
          label="Crop categories detected"
          icon={<Layers3 className="h-4 w-4" />}
          loading={loadingSummary}
          value={cropsDetected !== null ? `${cropsDetected} / 8` : null}
          hint={cropsDetected === null ? 'Intended: 8 categories' : undefined}
        />
        <StatCard
          label="Latest satellite observation"
          icon={<CalendarClock className="h-4 w-4" />}
          loading={loadingSummary || availability.status === 'loading'}
          value={latestObs ? formatDate(latestObs) : null}
          unavailableText="Awaiting satellite data"
          hint={latestObs ? 'Sentinel-2 MSI' : undefined}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <DashboardCard
          flush
          title="Region map"
          subtitle="Mysuru district · OpenStreetMap base"
          actions={<Link to="/app/explorer" className="btn-ghost px-2 py-1 text-xs">Open explorer <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
        >
          <InteractiveMap
            className="h-[380px]"
            legendItems={field ? [{ label: 'Selected field', color: '#d97a1b', kind: 'line' }] : []}
          >
            {field && <FieldBoundaryLayer field={field} />}
          </InteractiveMap>
        </DashboardCard>

        <DashboardCard title="Crop distribution" subtitle="Classified area per crop type">
          <AsyncContent
            query={summary}
            resource="crop distribution"
            isEmpty={(d) => d.distribution.length === 0}
            empty={<EmptyState compact title="No classifications yet" description="Crop distribution will appear after fields in this region have been classified by the model." />}
          >
            {(d) => <CropDistributionChart data={d.distribution} />}
          </AsyncContent>
        </DashboardCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DashboardCard flush title="Classification summary" subtitle="By crop type">
          <AsyncContent query={summary} resource="classification summary" isEmpty={(d) => d.distribution.length === 0}>
            {(d) => {
              const total = d.distribution.reduce((acc, x) => acc + x.field_count, 0)
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] tracking-wide text-ink-subtle uppercase">
                        <th scope="col" className="px-4 py-2 font-medium">Crop</th>
                        <th scope="col" className="px-4 py-2 text-right font-medium">Fields</th>
                        <th scope="col" className="px-4 py-2 text-right font-medium">Area</th>
                        <th scope="col" className="px-4 py-2 text-right font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {[...d.distribution].sort((a, b) => b.field_count - a.field_count).map((row) => {
                        const c = getCrop(row.crop_type)
                        return (
                          <tr key={row.crop_type}>
                            <td className="px-4 py-2"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-[2px]" style={{ background: c.color }} aria-hidden="true" />{c.label}</span></td>
                            <td className="px-4 py-2 text-right tabular-nums">{formatNumber(row.field_count)}</td>
                            <td className="px-4 py-2 text-right tabular-nums">{formatHectares(row.area_ha)}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ink-muted">{total ? formatPercent(row.field_count / total) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {d.model_version && <p className="border-t border-line px-4 py-2 font-mono text-[11px] text-ink-subtle">Model {d.model_version}</p>}
                </div>
              )
            }}
          </AsyncContent>
        </DashboardCard>

        <DashboardCard
          flush
          title="Recent classification activity"
          actions={<Link to="/app/reports" className="btn-ghost px-2 py-1 text-xs">All reports <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
        >
          <AsyncContent
            query={history}
            resource="classification history"
            isEmpty={(d) => d.length === 0}
            empty={<EmptyState compact title="No activity yet" description="Classifications you run will be listed here once the backend stores them." />}
          >
            {(rows) => (
              <ul className="divide-y divide-line">
                {rows.map((r) => {
                  const c = r.crop_type ? getCrop(r.crop_type) : null
                  return (
                    <li key={r.prediction_id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: c?.color ?? '#cfd1c8' }} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c?.label ?? 'No prediction'}</p>
                        <p className="font-mono text-[11px] text-ink-subtle">{formatDateTime(r.created_at)} · obs {formatDate(r.observation_date)}</p>
                      </div>
                      {typeof r.confidence === 'number' && <span className="text-xs tabular-nums text-ink-muted">{formatPercent(r.confidence, 0)}</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </AsyncContent>
        </DashboardCard>

        <DashboardCard title="Dataset status" className="lg:col-span-2 xl:col-span-1" bodyClassName="py-1">
          <ul className="divide-y divide-line">
            <StatusRow
              label="Backend API"
              tone={backend.state === 'online' ? 'success' : backend.state === 'checking' ? 'info' : 'warning'}
              value={backend.state === 'online' ? 'Connected' : backend.state === 'checking' ? 'Checking' : 'Not connected'}
              detail={<code className="font-mono">{backend.baseUrl}</code>}
            />
            <StatusRow
              label="District boundary"
              tone={boundaryProps ? (boundaryProps.approximate ? 'warning' : 'success') : boundary.status === 'error' ? 'danger' : 'info'}
              value={boundaryProps ? (boundaryProps.approximate ? 'Approximate' : 'Official') : boundary.status === 'error' ? 'Missing' : 'Loading'}
              detail={boundaryProps?.source}
            />
            <StatusRow
              label="Sentinel-2 imagery"
              tone={availability.status === 'success' && (availability.data?.observations.length ?? 0) > 0 ? 'success' : availability.status === 'loading' ? 'info' : 'warning'}
              value={
                availability.status === 'success'
                  ? `${availability.data?.observations.length ?? 0} scenes`
                  : availability.status === 'loading'
                    ? 'Checking'
                    : 'Awaiting data'
              }
              detail="Level-2A surface reflectance"
            />
            <StatusRow
              label="Training labels"
              tone={s?.dataset?.training_samples ? 'success' : 'warning'}
              value={s?.dataset?.training_samples ? `${formatNumber(s.dataset.training_samples)} samples` : 'Not available'}
              detail={s?.dataset?.label_source ?? 'Verified ground-truth crop labels required'}
            />
            <StatusRow
              label="Classification model"
              tone={s?.model_version ? 'success' : 'warning'}
              value={s?.model_version ?? 'Not deployed'}
            />
          </ul>
        </DashboardCard>
      </div>
    </div>
  )
}
