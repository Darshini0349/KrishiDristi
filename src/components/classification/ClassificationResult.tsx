import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleDashed, CloudOff, ScanSearch, XCircle } from 'lucide-react'
import type { MutationResult } from '@/hooks/useApi'
import type { ClassificationStatus, PredictRequest, PredictResponse } from '@/types/classification'
import { getCrop } from '@/config/crops'
import { EmptyState, ErrorState, LoadingIndicator, StatusBadge, type BadgeTone } from '@/components/ui'
import { formatDate, formatDateTime, formatHectares, formatPercent } from '@/utils/format'

interface ClassificationResultProps {
  result: MutationResult<PredictRequest, PredictResponse>
  /** Area computed client-side from the drawn polygon (used if the API omits it). */
  localAreaHa: number | null
  onRetry?: () => void
}

const STATUS: Record<ClassificationStatus, { tone: BadgeTone; label: string; icon: ReactNode }> = {
  completed: { tone: 'success', label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { tone: 'info', label: 'Pending', icon: <CircleDashed className="h-3 w-3" /> },
  no_data: { tone: 'warning', label: 'No data', icon: <CloudOff className="h-3 w-3" /> },
  failed: { tone: 'danger', label: 'Failed', icon: <XCircle className="h-3 w-3" /> },
}

function ElapsedTimer() {
  const [s, setS] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setS((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="font-mono tabular-nums">{s}s</span>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  )
}

const NotReturned = () => <span className="font-normal text-ink-subtle">Not returned by model</span>

export function ClassificationResult({ result, localAreaHa, onRetry }: ClassificationResultProps) {
  if (result.status === 'idle') {
    return (
      <EmptyState
        icon={<ScanSearch className="h-4 w-4" />}
        title="No classification yet"
        description="Draw a field boundary on the map, choose an observation date and run the classification. Results from the model will appear here."
      />
    )
  }

  if (result.status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" aria-busy="true">
        <LoadingIndicator label="Running classification…" />
        <p className="max-w-xs text-xs text-ink-muted">
          Request sent to the model service. Waiting for a response — <ElapsedTimer />
        </p>
      </div>
    )
  }

  if (result.status === 'error' && result.error) {
    return <ErrorState error={result.error} resource="a prediction" onRetry={onRetry} />
  }

  const data = result.data
  if (!data) return null
  const status = STATUS[data.status] ?? STATUS.failed

  if (data.status === 'no_data') {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<CloudOff className="h-4 w-4" />}
          title="No satellite data or crop labels"
          description={data.message ?? 'The selected field or date has no usable Sentinel-2 imagery (e.g. cloud cover) or no training labels for this region.'}
        />
      </div>
    )
  }

  const crop = data.crop_type ? getCrop(data.crop_type) : null
  const area = data.field_area_ha ?? localAreaHa
  const hasConfidence = typeof data.confidence === 'number'
  const probs = data.class_probabilities ? Object.entries(data.class_probabilities).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)) : []

  return (
    <div className="animate-fade-in">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">Predicted crop type</p>
          <StatusBadge tone={status.tone}>{status.icon}{status.label}</StatusBadge>
        </div>
        {crop ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="h-8 w-1.5 rounded-full" style={{ background: crop.color }} aria-hidden="true" />
            <div>
              <p className="text-2xl font-semibold tracking-tight">{crop.label}</p>
              <p className="text-xs text-ink-muted">{crop.localName}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">{data.message ?? 'The model did not return a crop type.'}</p>
        )}
        {hasConfidence && (
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-ink-muted">Model confidence</span>
              <span className="font-semibold tabular-nums">{formatPercent(data.confidence)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={data.confidence ?? 0} aria-label="Model confidence">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${(data.confidence ?? 0) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <dl className="divide-y divide-line px-4">
        <Row label="Model confidence">{hasConfidence ? formatPercent(data.confidence) : <NotReturned />}</Row>
        <Row label="Field area">
          {formatHectares(area)}
          {data.field_area_ha == null && area != null && <span className="ml-1 text-[11px] font-normal text-ink-subtle">(computed from polygon)</span>}
        </Row>
        <Row label="Observation date">{formatDate(data.observation_date)}</Row>
        <Row label="Model version"><span className="font-mono text-xs">{data.model_version ?? '—'}</span></Row>
        <Row label="Prediction ID"><span className="font-mono text-xs">{data.prediction_id}</span></Row>
        {data.created_at && <Row label="Processed">{formatDateTime(data.created_at)}</Row>}
      </dl>

      {probs.length > 0 && (
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-xs font-medium text-ink-muted">Class probabilities (from model)</p>
          <ul className="space-y-1.5">
            {probs.map(([id, p]) => {
              const c = getCrop(id)
              return (
                <li key={id} className="grid grid-cols-[96px_1fr_44px] items-center gap-2 text-xs">
                  <span className="truncate">{c.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full" style={{ width: `${(p ?? 0) * 100}%`, background: c.color }} /></span>
                  <span className="text-right tabular-nums text-ink-muted">{formatPercent(p, 0)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {data.message && crop && <p className="border-t border-line px-4 py-3 text-xs text-ink-muted">{data.message}</p>}
    </div>
  )
}
