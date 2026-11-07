import { CROP_CATEGORIES } from '@/config/crops'

/**
 * Schematic illustration of satellite-based field classification.
 * Deliberately stylised — it must never be mistaken for real imagery.
 */
const PARCELS: { d: string; crop: number }[] = [
  { d: 'M40 70 L150 58 L162 140 L48 152 Z', crop: 0 },
  { d: 'M150 58 L262 48 L270 122 L162 140 Z', crop: 4 },
  { d: 'M262 48 L360 44 L364 118 L270 122 Z', crop: 1 },
  { d: 'M48 152 L162 140 L170 222 L56 236 Z', crop: 2 },
  { d: 'M162 140 L270 122 L280 206 L170 222 Z', crop: 0 },
  { d: 'M270 122 L364 118 L370 196 L280 206 Z', crop: 5 },
  { d: 'M56 236 L170 222 L176 300 L62 316 Z', crop: 3 },
  { d: 'M170 222 L280 206 L286 288 L176 300 Z', crop: 6 },
  { d: 'M280 206 L370 196 L374 278 L286 288 Z', crop: 1 },
]

export function HeroIllustration() {
  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-lg border border-brand-800 bg-brand-950 shadow-float">
        <svg viewBox="0 0 420 360" className="block h-auto w-full" role="img" aria-labelledby="hero-ill-title">
          <title id="hero-ill-title">Schematic: a satellite passes over agricultural parcels, each classified by crop type</title>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="#adcfbb" strokeOpacity=".07" />
            </pattern>
            <linearGradient id="scan" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#adcfbb" stopOpacity="0" />
              <stop offset="1" stopColor="#adcfbb" stopOpacity=".22" />
            </linearGradient>
          </defs>
          <rect width="420" height="360" fill="url(#grid)" />

          {/* Parcels */}
          <g>
            {PARCELS.map((p, i) => (
              <path key={i} d={p.d} fill={CROP_CATEGORIES[p.crop].color} fillOpacity=".55" stroke="#0a1d16" strokeWidth="2" />
            ))}
          </g>
          {/* Field boundary being classified */}
          <path d="M162 140 L270 122 L280 206 L170 222 Z" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 4" />
          <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#ffffff">
            <rect x="186" y="160" width="74" height="26" rx="3" fill="#0a1d16" fillOpacity=".85" />
            <text x="192" y="171">FIELD 0142</text>
            <text x="192" y="181" fill="#adcfbb">class: ?</text>
          </g>

          {/* Swath */}
          <path d="M318 20 L120 330 L330 330 Z" fill="url(#scan)" />
          {/* Orbit + satellite */}
          <path d="M-10 92 C 120 10, 300 -6, 430 26" fill="none" stroke="#adcfbb" strokeOpacity=".5" strokeDasharray="2 5" />
          <g transform="translate(310 14) rotate(12)">
            <rect x="-6" y="-5" width="12" height="10" rx="1.5" fill="#eef5f1" />
            <rect x="-26" y="-3" width="17" height="6" fill="#4f9070" stroke="#eef5f1" strokeWidth=".8" />
            <rect x="9" y="-3" width="17" height="6" fill="#4f9070" stroke="#eef5f1" strokeWidth=".8" />
          </g>

          {/* Frame ticks + labels */}
          <g fontFamily="JetBrains Mono, monospace" fontSize="8.5" fill="#7eb295">
            <text x="14" y="350">MSI · B2 B3 B4 B8 · 10 m</text>
            <text x="300" y="350">MYSURU · KA</text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 flex items-center justify-between gap-2 font-mono text-[10.5px] text-ink-subtle">
        <span>Schematic illustration — not satellite imagery</span>
        <span>Colours = crop classes</span>
      </figcaption>
    </figure>
  )
}
