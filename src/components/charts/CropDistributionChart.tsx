import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CropDistributionEntry } from '@/types/classification'
import { getCrop } from '@/config/crops'
import { formatNumber } from '@/utils/format'
import { EmptyState } from '@/components/ui'

interface CropDistributionChartProps {
  data: CropDistributionEntry[]
  /** Measure to plot. Area falls back to field count when the backend omits area. */
  metric?: 'area_ha' | 'field_count'
}

interface Row {
  crop: string
  label: string
  color: string
  value: number
  fields: number
  area: number | null
}

/**
 * Horizontal bar chart of crop distribution, sorted by magnitude.
 * Each bar carries its crop name on the axis plus a direct value label,
 * so identity never depends on colour alone.
 */
export function CropDistributionChart({ data, metric = 'area_ha' }: CropDistributionChartProps) {
  const useArea = metric === 'area_ha' && data.every((d) => typeof d.area_ha === 'number')
  const rows: Row[] = data
    .map((d) => {
      const crop = getCrop(d.crop_type)
      return {
        crop: crop.id,
        label: crop.label,
        color: crop.color,
        value: useArea ? (d.area_ha as number) : d.field_count,
        fields: d.field_count,
        area: d.area_ha ?? null,
      }
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)

  if (rows.length === 0) {
    return <EmptyState compact title="No classified fields" description="The summary returned no crop distribution for this region." />
  }

  const unit = useArea ? 'ha' : 'fields'
  return (
    <figure>
      <div style={{ height: Math.max(160, rows.length * 38 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke="#e3e4de" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#868e88' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 12, fill: '#17201b' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#eef5f1' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const r = payload[0].payload as Row
                return (
                  <div className="rounded-md border border-line bg-panel px-3 py-2 text-xs shadow-float">
                    <p className="flex items-center gap-1.5 font-semibold text-ink">
                      <span className="h-2 w-2 rounded-[2px]" style={{ background: r.color }} aria-hidden="true" />
                      {r.label}
                    </p>
                    <p className="mt-1 text-ink-muted">Fields: <span className="font-medium text-ink tabular-nums">{formatNumber(r.fields)}</span></p>
                    {r.area !== null && <p className="text-ink-muted">Area: <span className="font-medium text-ink tabular-nums">{formatNumber(r.area, 1)} ha</span></p>}
                  </div>
                )
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.crop} fill={r.color} />)}
              <LabelList dataKey="value" position="right" formatter={(v: unknown) => formatNumber(Number(v), useArea ? 1 : 0)} style={{ fontSize: 11, fill: '#56605a' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-subtle">
        {useArea ? 'Classified area by crop (hectares).' : 'Number of classified fields by crop.'} Values from backend summary · unit: {unit}
      </figcaption>
      <table className="sr-only">
        <caption>Crop distribution</caption>
        <thead><tr><th>Crop</th><th>Fields</th><th>Area (ha)</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.crop}><td>{r.label}</td><td>{r.fields}</td><td>{r.area ?? 'n/a'}</td></tr>)}</tbody>
      </table>
    </figure>
  )
}
