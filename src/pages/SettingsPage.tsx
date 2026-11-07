import { useState, type FormEvent } from 'react'
import { CheckCircle2, PlugZap, RotateCw } from 'lucide-react'
import { DashboardCard, NotImplementedBadge, PageHeader, StatusBadge } from '@/components/ui'
import { useBackendStatus } from '@/context/BackendStatusContext'
import { env, getApiBaseUrl, hasApiBaseUrlOverride, setApiBaseUrlOverride } from '@/config/env'
import { ENDPOINTS } from '@/services/api/endpoints'
import { useDistrictBoundary } from '@/hooks/useDistrictBoundary'
import { DISTRICT_BOUNDARY_URL } from '@/config/map'
import { formatDateTime } from '@/utils/format'

const ENDPOINT_DOCS = [
  { method: 'GET', path: '/api/health', purpose: 'Backend health and model status' },
  { method: 'GET', path: ENDPOINTS.regions, purpose: 'List supported regions' },
  { method: 'GET', path: ENDPOINTS.region('mysuru'), purpose: 'Region detail and boundary' },
  { method: 'GET', path: ENDPOINTS.satelliteAvailability, purpose: 'Sentinel-2 acquisitions and imagery tile layers' },
  { method: 'POST', path: ENDPOINTS.predict, purpose: 'Classify a field polygon for a date' },
  { method: 'GET', path: ENDPOINTS.history, purpose: 'Stored classification results' },
  { method: 'GET', path: ENDPOINTS.summary, purpose: 'Region-level crop distribution' },
]

function isValidUrl(v: string) {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function SettingsPage() {
  const backend = useBackendStatus()
  const boundary = useDistrictBoundary()
  const [url, setUrl] = useState(getApiBaseUrl())
  const [overridden, setOverridden] = useState(hasApiBaseUrlOverride())
  const [error, setError] = useState<string | null>(null)

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidUrl(url)) return setError('Enter a full http(s) URL, e.g. http://localhost:8000')
    setError(null)
    setApiBaseUrlOverride(url === env.buildApiBaseUrl ? null : url)
    setOverridden(url !== env.buildApiBaseUrl)
    backend.recheck()
  }
  const reset = () => {
    setApiBaseUrlOverride(null)
    setUrl(env.buildApiBaseUrl)
    setOverridden(false)
    setError(null)
    backend.recheck()
  }

  const props = boundary.status === 'success' ? boundary.data.features[0]?.properties : null

  return (
    <div className="max-w-4xl space-y-5 p-4 sm:p-6">
      <PageHeader eyebrow="Settings" title="Configuration" description="Backend connection and data sources for this browser." />

      <DashboardCard
        title="API connection"
        subtitle="FastAPI backend base URL. Saved in this browser only."
        actions={
          <StatusBadge tone={backend.state === 'online' ? 'success' : backend.state === 'checking' ? 'info' : 'warning'} dot>
            {backend.state === 'online' ? 'Connected' : backend.state === 'checking' ? 'Checking' : 'Not connected'}
          </StatusBadge>
        }
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <label htmlFor="api-url" className="label">Base URL</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id="api-url" className="input font-mono" value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} aria-invalid={!!error} aria-describedby="api-url-help" />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary"><PlugZap className="h-4 w-4" aria-hidden="true" /> Save & test</button>
                <button type="button" className="btn-secondary" onClick={backend.recheck}><RotateCw className="h-4 w-4" aria-hidden="true" /> Test</button>
              </div>
            </div>
            <p id="api-url-help" className={`mt-1.5 text-[11px] ${error ? 'text-danger-600' : 'text-ink-subtle'}`}>
              {error ?? (
                <>
                  Build default: <code className="font-mono">{env.buildApiBaseUrl}</code> (VITE_API_BASE_URL).{' '}
                  {overridden && <button type="button" className="font-medium text-brand-700 underline-offset-2 hover:underline" onClick={reset}>Reset to default</button>}
                </>
              )}
            </p>
          </div>
          <p className="text-xs text-ink-muted">
            Last checked: {formatDateTime(backend.lastCheckedAt?.toISOString())}
            {backend.state === 'offline' && backend.lastError && <> · {backend.lastError.message}</>}
            {backend.state === 'online' && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-brand-600" aria-label="ok" />}
          </p>
        </form>
      </DashboardCard>

      <DashboardCard flush title="API endpoints" subtitle="Implemented by the FastAPI service in backend/. Interactive docs at /docs on the API server.">
        <ul className="divide-y divide-line">
          {ENDPOINT_DOCS.map((e) => (
            <li key={e.method + e.path} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <span className={`w-12 font-mono text-[11px] font-semibold ${e.method === 'POST' ? 'text-info-600' : 'text-brand-600'}`}>{e.method}</span>
              <code className="font-mono text-xs text-ink">{e.path}</code>
              <span className="text-xs text-ink-muted sm:ml-auto">{e.purpose}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard title="Geospatial data sources">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="label">District boundary file</dt><dd className="font-mono text-xs">{DISTRICT_BOUNDARY_URL}</dd></div>
          <div>
            <dt className="label">Boundary status</dt>
            <dd>{props ? <StatusBadge tone={props.approximate ? 'warning' : 'success'}>{props.approximate ? 'Approximate placeholder' : 'Loaded from source data'}</StatusBadge> : boundary.status === 'error' ? <StatusBadge tone="danger">{boundary.error}</StatusBadge> : '—'}</dd>
          </div>
          <div className="sm:col-span-2"><dt className="label">Boundary source</dt><dd className="text-xs text-ink-muted">{props?.source ?? '—'}</dd></div>
          <div className="sm:col-span-2"><dt className="label">Taluk boundaries</dt><dd className="font-mono text-xs">/data/mysuru-taluks.geojson</dd></div>
          <div><dt className="label">Base map</dt><dd className="text-xs text-ink-muted">OpenStreetMap standard tiles</dd></div>
          <div><dt className="label">Coordinate reference</dt><dd className="font-mono text-xs">EPSG:4326 (GeoJSON [lng, lat])</dd></div>
        </dl>
      </DashboardCard>

      <DashboardCard title="Not implemented yet" subtitle="Shown for transparency — these controls are intentionally absent.">
        <ul className="space-y-2.5 text-sm">
          {['User accounts & authentication', 'Saved fields and workspaces', 'Email / SMS alerts', 'Model selection & retraining'].map((f) => (
            <li key={f} className="flex items-center justify-between gap-3"><span className="text-ink-muted">{f}</span><NotImplementedBadge /></li>
          ))}
        </ul>
      </DashboardCard>
    </div>
  )
}
