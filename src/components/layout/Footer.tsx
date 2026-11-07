import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui'

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-brand-950 text-brand-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-300">
            Satellite-based crop type classification for Mysuru district, Karnataka — built on Copernicus Sentinel-2 imagery and machine learning.
          </p>
        </div>
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.14em] text-brand-400 uppercase">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/app">Overview</Link></li>
            <li><Link className="hover:text-white" to="/app/classify">Crop Classification</Link></li>
            <li><Link className="hover:text-white" to="/app/explorer">Satellite Explorer</Link></li>
            <li><Link className="hover:text-white" to="/app/reports">Reports</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.14em] text-brand-400 uppercase">Data & credits</h3>
          <ul className="mt-3 space-y-2 text-sm text-brand-300">
            <li>Contains modified Copernicus Sentinel data (once imagery is ingested)</li>
            <li>Base map © OpenStreetMap contributors</li>
            <li>Released under the MIT License</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 font-mono text-[11px] text-brand-400 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} KrishiDrishti</span>
          <span>v1 · Research prototype · Mysuru district</span>
        </div>
      </div>
    </footer>
  )
}
