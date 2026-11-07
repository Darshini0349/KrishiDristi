import { useId, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Search } from 'lucide-react'
import { TALUK_HEADQUARTERS } from '@/config/map'
import { parseLatLngInput } from '@/utils/geo'
import { DASHBOARD_NAV } from './navigation'

type Suggestion =
  | { kind: 'coords'; label: string; lat: number; lng: number }
  | { kind: 'place'; label: string; lat: number; lng: number }
  | { kind: 'page'; label: string; to: string }

/**
 * Search: accepts "lat, lng" coordinates, taluk headquarters towns and page names.
 * Location results open the Satellite Explorer centred on that point.
 */
export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const listId = useId()

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Suggestion[] = []
    const pos = parseLatLngInput(q)
    if (pos) out.push({ kind: 'coords', label: `${pos[1].toFixed(5)}, ${pos[0].toFixed(5)}`, lat: pos[1], lng: pos[0] })
    for (const t of TALUK_HEADQUARTERS) if (t.name.toLowerCase().includes(q)) out.push({ kind: 'place', label: t.name, lat: t.lat, lng: t.lng })
    for (const n of DASHBOARD_NAV) if (n.label.toLowerCase().includes(q)) out.push({ kind: 'page', label: n.label, to: n.to })
    return out.slice(0, 7)
  }, [query])

  const choose = (s: Suggestion) => {
    if (s.kind === 'page') navigate(s.to)
    else navigate(`/app/explorer?lat=${s.lat}&lng=${s.lng}&label=${encodeURIComponent(s.label)}`)
    setQuery('')
    setOpen(false)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (suggestions[active]) choose(suggestions[active])
  }

  const showList = open && query.trim().length > 0

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Search taluk, page or lat, lng"
        className="input h-9 pl-9"
        aria-label="Search locations, coordinates or pages"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-[1300] mt-1 overflow-hidden rounded-md border border-line bg-panel py-1 shadow-float">
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-ink-muted">No match. Try a taluk name (e.g. Hunsur) or coordinates like 12.30, 76.64.</li>
          ) : (
            suggestions.map((s, i) => (
              <li key={`${s.kind}-${s.label}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${i === active ? 'bg-brand-50' : ''}`}
                >
                  {s.kind === 'page' ? <Navigation className="h-3.5 w-3.5 text-ink-subtle" /> : <MapPin className="h-3.5 w-3.5 text-brand-500" />}
                  <span className={s.kind === 'coords' ? 'font-mono text-xs' : ''}>{s.label}</span>
                  <span className="ml-auto text-[11px] text-ink-subtle">
                    {s.kind === 'page' ? 'Page' : s.kind === 'place' ? 'Taluk HQ (approx.)' : 'Coordinates'}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </form>
  )
}
