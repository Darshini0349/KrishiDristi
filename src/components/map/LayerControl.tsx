import { Layers } from 'lucide-react'
import { StatusBadge } from '@/components/ui'

export interface MapLayerOption {
  id: string
  label: string
  description?: string
  /** False when no real data source exists for the layer yet. */
  available: boolean
  unavailableReason?: string
  visible: boolean
  group: 'Base map' | 'Boundaries' | 'Satellite imagery' | 'Analysis'
}

interface LayerControlProps {
  layers: MapLayerOption[]
  onToggle: (id: string, visible: boolean) => void
  className?: string
}

/** Layer visibility panel. Unavailable layers are shown but cannot be enabled. */
export function LayerControl({ layers, onToggle, className = '' }: LayerControlProps) {
  const groups = [...new Set(layers.map((l) => l.group))]
  return (
    <div className={`rounded-lg border border-line bg-panel shadow-panel ${className}`}>
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <Layers className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Layers</h2>
      </div>
      <div className="divide-y divide-line">
        {groups.map((group) => (
          <fieldset key={group} className="px-3.5 py-3">
            <legend className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-subtle uppercase">{group}</legend>
            <ul className="space-y-2">
              {layers
                .filter((l) => l.group === group)
                .map((layer) => {
                  const id = `layer-${layer.id}`
                  return (
                    <li key={layer.id} className="flex items-start gap-2.5">
                      <input
                        id={id}
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700 disabled:opacity-40"
                        checked={layer.available && layer.visible}
                        disabled={!layer.available}
                        onChange={(e) => onToggle(layer.id, e.target.checked)}
                        aria-describedby={layer.description || !layer.available ? `${id}-desc` : undefined}
                      />
                      <label htmlFor={id} className={`min-w-0 flex-1 text-sm ${layer.available ? 'cursor-pointer text-ink' : 'text-ink-subtle'}`}>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {layer.label}
                          {!layer.available && <StatusBadge>Not available</StatusBadge>}
                        </span>
                        {(layer.description || !layer.available) && (
                          <span id={`${id}-desc`} className="mt-0.5 block text-[11px] leading-snug text-ink-subtle">
                            {layer.available ? layer.description : layer.unavailableReason}
                          </span>
                        )}
                      </label>
                    </li>
                  )
                })}
            </ul>
          </fieldset>
        ))}
      </div>
    </div>
  )
}
