import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleMarker, TileLayer, Tooltip } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import { Copy, Crosshair, MapPin, PencilRuler, X } from 'lucide-react'
import { DashboardCard, PageHeader, StatusBadge } from '@/components/ui'
import { FieldBoundaryLayer, FlyTo, InteractiveMap, LayerControl, type LegendItem, type MapLayerOption } from '@/components/map'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useSatelliteAvailability } from '@/hooks/useRegionData'
import type { SatelliteLayerSource } from '@/types/satellite'
import { CROP_CATEGORIES } from '@/config/crops'
import { formatCoord, formatDate, formatHectares } from '@/utils/format'
import { m2ToHectares, polygonArea, polygonBBox } from '@/utils/geo'
import type { CursorState } from '@/components/map'

type RasterId = SatelliteLayerSource['id']

const RASTER_LAYERS: { id: RasterId; label: string; description: string; group: MapLayerOption['group'] }[] = [
  { id: 'sentinel2_true_color', label: 'Sentinel-2 true colour', description: 'B4 / B3 / B2 composite, 10 m', group: 'Satellite imagery' },
  { id: 'sentinel2_false_color', label: 'Sentinel-2 false colour', description: 'B8 / B4 / B3 — vegetation appears red', group: 'Satellite imagery' },
  { id: 'ndvi', label: 'NDVI', description: '(B8 − B4) / (B8 + B4)', group: 'Analysis' },
  { id: 'classification', label: 'Crop classification', description: 'Model output raster', group: 'Analysis' },
]

export default function SatelliteExplorerPage() {
  const { region, field } = useWorkspace()
  const availability = useSatelliteAvailability(region.id)
  const [params, setParams] = useSearchParams()
  const [visible, setVisible] = useState<Record<string, boolean>>({ osm: true, boundary: true, field: true })
  const [clicked, setClicked] = useState<CursorState | null>(null)
  const [copied, setCopied] = useState(false)

  // Search target from the global search (?lat=&lng=&label=)
  const target = useMemo(() => {
    const lat = Number(params.get('lat'))
    const lng = Number(params.get('lng'))
    if (!params.has('lat') || Number.isNaN(lat) || Number.isNaN(lng)) return null
    return { pos: [lat, lng] as LatLngTuple, label: params.get('label') ?? 'Search result' }
  }, [params])

  const sources = useMemo(() => {
    const map = new Map<RasterId, SatelliteLayerSource>()
    if (availability.status === 'success') for (const l of availability.data?.layers ?? []) map.set(l.id, l)
    return map
  }, [availability])

  const unavailableReason =
    availability.status === 'loading'
      ? 'Checking imagery availability…'
      : availability.status === 'error'
        ? 'Backend not connected — no imagery source.'
        : 'No processed imagery published by the backend yet.'

  const layers: MapLayerOption[] = [
    { id: 'osm', label: 'OpenStreetMap', description: 'Reference base map', available: true, visible: !!visible.osm, group: 'Base map' },
    { id: 'boundary', label: 'Mysuru district boundary', available: true, visible: !!visible.boundary, group: 'Boundaries' },
    {
      id: 'field',
      label: 'Selected field',
      description: field ? 'From Crop Classification' : undefined,
      available: !!field,
      unavailableReason: 'Draw a field on the Crop Classification page.',
      visible: !!visible.field,
      group: 'Boundaries',
    },
    ...RASTER_LAYERS.map((r) => {
      const src = sources.get(r.id)
      return {
        id: r.id,
        label: r.label,
        description: src?.date ? `${r.description} · ${formatDate(src.date)}` : r.description,
        available: !!src,
        unavailableReason,
        visible: !!visible[r.id],
        group: r.group,
      }
    }),
  ]

  const showClassLegend = !!visible.classification && sources.has('classification')
  const legendItems: LegendItem[] = [
    ...(field && visible.field ? [{ label: 'Selected field', color: '#d97a1b', kind: 'line' as const }] : []),
    ...(showClassLegend ? CROP_CATEGORIES.map((c) => ({ label: c.label, color: c.color })) : []),
  ]

  const copyClicked = async () => {
    if (!clicked) return
    try {
      await navigator.clipboard.writeText(`${clicked.lat.toFixed(6)}, ${clicked.lng.toFixed(6)}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const obsCount = availability.status === 'success' ? (availability.data?.observations.length ?? 0) : null

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Satellite explorer"
        title="Map layers & field boundaries"
        description="Inspect Mysuru district on the reference map. Sentinel-2 and model layers appear here once the backend publishes real imagery tiles."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <DashboardCard flush className="overflow-hidden" bodyClassName="flex flex-col">
          <InteractiveMap
            className="h-[60vh] min-h-[420px] xl:h-[calc(100dvh-13rem)] xl:min-h-[600px]"
            showBaseLayer={!!visible.osm}
            showBoundary={!!visible.boundary}
            fitToBoundary={!target}
            legendItems={legendItems}
            onMapClick={setClicked}
            ariaLabel="Satellite explorer map of Mysuru district"
          >
            {RASTER_LAYERS.map((r) => {
              const src = sources.get(r.id)
              return src && visible[r.id] ? (
                <TileLayer key={r.id} url={src.tile_url} attribution={src.attribution ?? 'Contains modified Copernicus Sentinel data'} opacity={r.id === 'classification' ? 0.75 : 1} />
              ) : null
            })}
            {field && visible.field && <FieldBoundaryLayer field={field} />}
            {clicked && (
              <CircleMarker center={[clicked.lat, clicked.lng]} radius={5} pathOptions={{ color: '#0f2a20', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }} />
            )}
            {target && (
              <CircleMarker center={target.pos} radius={7} pathOptions={{ color: '#1f4d3a', weight: 2, fillColor: '#4f9070', fillOpacity: 0.9 }}>
                <Tooltip permanent direction="top" offset={[0, -8]} className="kd-tooltip">{target.label}</Tooltip>
              </CircleMarker>
            )}
            <FlyTo target={target?.pos ?? null} zoom={13} />
          </InteractiveMap>
        </DashboardCard>

        <div className="space-y-4">
          <LayerControl layers={layers} onToggle={(id, v) => setVisible((s) => ({ ...s, [id]: v }))} />

          <DashboardCard title="Selected point" subtitle="Click anywhere on the map">
            {clicked ? (
              <div className="space-y-2">
                <dl className="space-y-1 font-mono text-xs tabular-nums">
                  <div className="flex justify-between"><dt className="text-ink-subtle">Lat</dt><dd>{formatCoord(clicked.lat, 'lat', 6)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-subtle">Lng</dt><dd>{formatCoord(clicked.lng, 'lng', 6)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-subtle">GeoJSON</dt><dd>[{clicked.lng.toFixed(6)}, {clicked.lat.toFixed(6)}]</dd></div>
                </dl>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={copyClicked}>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {copied ? 'Copied' : 'Copy lat, lng'}
                  </button>
                  <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => setClicked(null)}>
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear
                  </button>
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-xs text-ink-muted"><Crosshair className="h-3.5 w-3.5" aria-hidden="true" /> No point selected.</p>
            )}
            {target && (
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs">
                <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                <span className="truncate">Search: {target.label}</span>
                <button type="button" className="ml-auto text-ink-muted hover:text-ink" onClick={() => setParams({})} aria-label="Clear search marker">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="Selected field">
            {field ? (
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between"><dt className="text-ink-muted">Area</dt><dd className="font-medium">{formatHectares(m2ToHectares(polygonArea(field.geometry)))}</dd></div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Bounds</dt>
                  <dd className="text-right font-mono text-[10.5px]">{polygonBBox(field.geometry).map((v) => v.toFixed(4)).join(', ')}</dd>
                </div>
              </dl>
            ) : (
              <div className="text-xs text-ink-muted">
                <p>No field boundary selected.</p>
                <Link to="/app/classify" className="mt-2 inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
                  <PencilRuler className="h-3.5 w-3.5" aria-hidden="true" /> Draw a field
                </Link>
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="Imagery availability">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Sentinel-2 observations</span>
              {obsCount === null ? (
                <StatusBadge tone={availability.status === 'loading' ? 'info' : 'warning'}>{availability.status === 'loading' ? 'Checking' : 'Awaiting satellite data'}</StatusBadge>
              ) : (
                <span className="font-semibold tabular-nums">{obsCount}</span>
              )}
            </div>
            {availability.status === 'success' && availability.data?.latest_observation_date && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Latest</span>
                <span className="font-medium">{formatDate(availability.data.latest_observation_date)}</span>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </div>
  )
}
