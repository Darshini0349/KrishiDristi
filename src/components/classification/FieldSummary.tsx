import { useRef, useState } from 'react'
import { AlertTriangle, FileUp, PencilRuler, Trash2 } from 'lucide-react'
import type { Feature, Polygon } from 'geojson'
import type { FieldFeature } from '@/types/geo'
import { closeRing, m2ToHectares, polygonArea, polygonCentroid } from '@/utils/geo'
import { formatCoord, formatHectares } from '@/utils/format'

interface FieldSummaryProps {
  field: FieldFeature | null
  onChange: (f: FieldFeature | null) => void
  /** Warning about the field (e.g. outside district). */
  warning?: string | null
  disabled?: boolean
}

/** Parse an uploaded GeoJSON file into a single field polygon. */
function parseFieldFile(text: string): FieldFeature {
  const json = JSON.parse(text) as { type?: string; features?: Feature[]; geometry?: Polygon; coordinates?: unknown }
  let geom: Polygon | undefined
  if (json.type === 'FeatureCollection') geom = json.features?.find((f) => f.geometry?.type === 'Polygon')?.geometry as Polygon | undefined
  else if (json.type === 'Feature') geom = json.geometry?.type === 'Polygon' ? json.geometry : undefined
  else if (json.type === 'Polygon') geom = json as unknown as Polygon
  if (!geom) throw new Error('No Polygon geometry found. Upload a GeoJSON Polygon, Feature or FeatureCollection (EPSG:4326).')
  const [lng, lat] = geom.coordinates[0]?.[0] ?? []
  if (typeof lng !== 'number' || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
    throw new Error('Coordinates do not look like WGS84 longitude/latitude. Reproject to EPSG:4326 first.')
  }
  return { type: 'Feature', properties: { source: 'uploaded' }, geometry: { type: 'Polygon', coordinates: geom.coordinates.map(closeRing) } }
}

export function FieldSummary({ field, onChange, warning, disabled }: FieldSummaryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setUploadError(null)
    try {
      onChange(parseFieldFile(await file.text()))
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Could not read file')
    }
  }

  const uploadButton = (
    <>
      <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={disabled}>
        <FileUp className="h-3.5 w-3.5" aria-hidden="true" /> Upload GeoJSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
          e.target.value = ''
        }}
      />
    </>
  )

  if (!field) {
    return (
      <div>
        <div className="rounded-md border border-dashed border-line-strong bg-surface px-3 py-3 text-xs leading-relaxed text-ink-muted">
          <p className="flex items-center gap-1.5 font-medium text-ink">
            <PencilRuler className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" /> No field selected
          </p>
          <p className="mt-1">Use the polygon or rectangle tool at the top-right of the map to outline a field, or upload a boundary.</p>
        </div>
        <div className="mt-2 flex">{uploadButton}</div>
        {uploadError && <p className="mt-1.5 text-[11px] text-danger-600" role="alert">{uploadError}</p>}
      </div>
    )
  }

  const areaHa = m2ToHectares(polygonArea(field.geometry))
  const [cLng, cLat] = polygonCentroid(field.geometry)
  const vertices = field.geometry.coordinates[0].length - 1

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border border-line bg-surface px-3 py-2.5 text-xs">
        <div><dt className="text-ink-subtle">Area</dt><dd className="font-semibold tabular-nums">{formatHectares(areaHa)}</dd></div>
        <div><dt className="text-ink-subtle">Vertices</dt><dd className="font-semibold tabular-nums">{vertices}</dd></div>
        <div className="col-span-2">
          <dt className="text-ink-subtle">Centroid</dt>
          <dd className="font-mono text-[11px] tabular-nums">{formatCoord(cLat, 'lat')}, {formatCoord(cLng, 'lng')}</dd>
        </div>
        <div className="col-span-2"><dt className="text-ink-subtle">Source</dt><dd className="capitalize">{field.properties.source}</dd></div>
      </dl>
      {warning && (
        <p className="mt-2 flex gap-1.5 text-[11px] leading-snug text-warn-600" role="alert">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" /> {warning}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => onChange(null)} disabled={disabled}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear field
        </button>
        {uploadButton}
      </div>
      {uploadError && <p className="mt-1.5 text-[11px] text-danger-600" role="alert">{uploadError}</p>}
    </div>
  )
}
