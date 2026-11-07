import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Info, Loader2, Satellite, ScanSearch } from 'lucide-react'
import { DashboardCard, PageHeader, StatusBadge } from '@/components/ui'
import { FieldSelector, InteractiveMap } from '@/components/map'
import { ClassificationResult, DateSelector, FieldSummary, RegionSelector } from '@/components/classification'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useMutation } from '@/hooks/useApi'
import { useRegions, useSatelliteAvailability } from '@/hooks/useRegionData'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { predictCrop } from '@/services/classification'
import type { PredictRequest } from '@/types/classification'
import { CROP_CATEGORIES } from '@/config/crops'

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <li className="relative pl-9">
      <span
        className={`absolute top-0 left-0 flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[11px] font-semibold ${done ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong bg-panel text-ink-muted'}`}
        aria-hidden="true"
      >
        {n}
      </span>
      <h3 className="pt-0.5 text-sm font-semibold">{title}<span className="sr-only">{done ? ' (complete)' : ''}</span></h3>
      <div className="mt-2.5">{children}</div>
    </li>
  )
}

export default function ClassificationPage() {
  const { region, setRegion, field, setField, observationDate, setObservationDate } = useWorkspace()
  const regions = useRegions()
  const availability = useSatelliteAvailability(region.id)
  const validation = useFieldValidation(field)

  const mutate = useCallback((req: PredictRequest, signal: AbortSignal) => predictCrop(req, signal), [])
  const prediction = useMutation(mutate)
  const running = prediction.status === 'loading'

  const canRun = !!field && !!observationDate && !validation.blocking && !running
  const run = () => {
    if (field && observationDate) void prediction.run({ region_id: region.id, observation_date: observationDate, field })
  }

  const onFieldChange = (f: typeof field) => {
    setField(f)
    if (prediction.status !== 'idle' && !running) prediction.reset()
  }

  const disabledReason = !field
    ? 'Select a field to continue.'
    : !observationDate
      ? 'Choose an observation date.'
      : validation.blocking
        ? 'Fix the field selection first.'
        : null

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Crop classification"
        title="Classify a field"
        description="Outline an agricultural field in Mysuru district, choose a Sentinel-2 observation and send it to the classification model."
        actions={
          <Link to="/app/explorer" className="btn-secondary">
            <Satellite className="h-4 w-4" aria-hidden="true" /> Open in Explorer
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,380px)_1fr]">
        <DashboardCard title="Classification inputs" subtitle={`Region · ${region.name}`} className="lg:col-start-1 lg:row-start-1">
          <ol className="space-y-6">
            <Step n={1} title="Geographical region" done>
              <RegionSelector regions={regions} value={region} onChange={setRegion} />
            </Step>
            <Step n={2} title="Field boundary" done={!!field && !validation.blocking}>
              <FieldSummary field={field} onChange={onFieldChange} warning={validation.warning} taluk={validation.taluk} disabled={running} />
            </Step>
            <Step n={3} title="Observation date" done={!!observationDate}>
              <DateSelector availability={availability} value={observationDate} onChange={setObservationDate} />
            </Step>
            <Step n={4} title="Run model" done={prediction.status === 'success'}>
              <button type="button" className="btn-primary w-full" onClick={run} disabled={!canRun} aria-describedby="run-hint">
                {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScanSearch className="h-4 w-4" aria-hidden="true" />}
                {running ? 'Classifying…' : 'Classify field'}
              </button>
              <p id="run-hint" className="mt-1.5 text-[11px] text-ink-subtle">
                {disabledReason ?? (
                  <>Sends <code className="font-mono">POST /api/classification/predict</code> with the field as GeoJSON.</>
                )}
              </p>
              {running && (
                <button type="button" className="btn-ghost mt-1 w-full py-1.5 text-xs" onClick={prediction.reset}>
                  Cancel request
                </button>
              )}
            </Step>
          </ol>
        </DashboardCard>

        <DashboardCard
          flush
          title="Field selection"
          subtitle="Draw with the polygon ▱ or rectangle ▭ tool; edit or delete with the tools below them."
          actions={field ? <StatusBadge tone="success" dot>Field selected</StatusBadge> : <StatusBadge>No field</StatusBadge>}
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
          bodyClassName="flex flex-col"
        >
          <InteractiveMap
            className="h-[420px] lg:h-auto lg:min-h-[560px] lg:flex-1"
            showTaluks
            legendItems={field ? [{ label: 'Selected field', color: '#d97a1b', kind: 'line' }] : []}
            ariaLabel="Map for selecting a field boundary in Mysuru district"
          >
            <FieldSelector value={field} onChange={onFieldChange} disabled={running} />
          </InteractiveMap>
        </DashboardCard>

        <DashboardCard
          flush
          title="Classification result"
          actions={prediction.data?.model_version ? <StatusBadge tone="info">{prediction.data.model_version}</StatusBadge> : undefined}
          className="lg:col-start-1 lg:row-start-2"
        >
          <ClassificationResult result={prediction} localAreaHa={validation.areaHa} onRetry={canRun ? run : undefined} />
        </DashboardCard>
      </div>

      <div className="flex gap-2.5 rounded-lg border border-line bg-panel px-4 py-3 text-xs leading-relaxed text-ink-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
        <p>
          <span className="font-medium text-ink">Intended crop categories:</span>{' '}
          {CROP_CATEGORIES.map((c) => c.label).join(', ')}. The final category set depends on verified ground-truth training data for Mysuru
          district; the model may not support every category.
        </p>
      </div>
    </div>
  )
}
