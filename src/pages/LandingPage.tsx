import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BrainCircuit, CheckCircle2, CircleDashed, Cloud, Database, Layers, Map as MapIcon, MapPinned,
  Satellite, ScanSearch, Server, Sprout, Target, Workflow,
} from 'lucide-react'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import { HeroIllustration } from '@/components/landing/HeroIllustration'
import { CROP_CATEGORIES } from '@/config/crops'

const STEPS = [
  { icon: Satellite, title: 'Acquire', body: 'Sentinel-2 Level-2A surface reflectance scenes over Mysuru district across the cropping season.' },
  { icon: Cloud, title: 'Pre-process', body: 'Cloud and shadow masking, band stacking and spectral indices such as NDVI to build per-field time series.' },
  { icon: BrainCircuit, title: 'Classify', body: 'A supervised machine-learning model trained on verified ground-truth labels predicts the crop type of each field.' },
  { icon: MapIcon, title: 'Map & report', body: 'Field-level predictions with model confidence are served through an API and visualised on interactive maps.' },
]

const STACK: { group: string; icon: typeof Satellite; items: string[] }[] = [
  { group: 'Earth observation', icon: Satellite, items: ['Copernicus Sentinel-2 MSI', 'Level-2A reflectance', 'Bands B2–B8, B11, B12'] },
  { group: 'Machine learning', icon: BrainCircuit, items: ['Python', 'Supervised classification', 'Per-field time-series features'] },
  { group: 'Backend', icon: Server, items: ['FastAPI', 'GeoJSON over REST', 'Raster tile serving'] },
  { group: 'Frontend', icon: Layers, items: ['React + TypeScript', 'Leaflet / OpenStreetMap', 'Recharts, Tailwind CSS'] },
]

const OBJECTIVES = [
  'Classify major crop types at field level using multi-temporal Sentinel-2 imagery.',
  'Build a verified, reusable ground-truth crop label set for Mysuru district.',
  'Report model confidence honestly and flag fields where data is insufficient.',
  'Provide an open, map-first interface for exploring results by field and date.',
]

const IMPACT = [
  { title: 'Crop area estimation', body: 'Timely, field-level crop maps can support area estimates that today rely heavily on manual surveys.' },
  { title: 'Agricultural planning', body: 'Knowing what is sown where helps plan procurement, storage, irrigation and input supply.' },
  { title: 'Scalable by design', body: 'Mysuru is the pilot; the same pipeline can extend to other districts as labelled data becomes available.' },
]

const STATUS: { label: string; done: boolean }[] = [
  { label: 'Web platform & map interface', done: true },
  { label: 'API contract defined', done: true },
  { label: 'FastAPI backend', done: true },
  { label: 'Live Sentinel-2 L2A access', done: true },
  { label: 'Verified ground-truth labels', done: false },
  { label: 'Trained & validated model', done: false },
]

function SectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {children && <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{children}</p>}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-panel focus:px-3 focus:py-2">Skip to content</a>
      <PublicNavbar />

      <main id="main">
        {/* Hero */}
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-20">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-sm border border-brand-200 bg-brand-50 px-2 py-1 font-mono text-[11px] tracking-wide text-brand-700">
                <MapPinned className="h-3 w-3" aria-hidden="true" /> Pilot region · Mysuru district, Karnataka
              </span>
              <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-brand-950 sm:text-5xl lg:text-[56px]">
                Understanding Agriculture Through Satellite Intelligence.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
                KrishiDrishti uses multi-temporal Sentinel-2 satellite imagery and machine learning to identify which crop is growing in each field — starting
                with Mysuru district, Karnataka.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/app" className="btn-primary px-5 py-2.5">
                  Explore Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/app/classify" className="btn-secondary px-5 py-2.5">
                  <ScanSearch className="h-4 w-4" aria-hidden="true" /> Classify a field
                </Link>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
                {[
                  ['Sensor', 'Sentinel-2 MSI'],
                  ['Resolution', '10 m'],
                  ['Crop classes', '8 intended'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-panel px-3 py-2.5">
                    <dt className="font-mono text-[10px] tracking-[0.12em] text-ink-subtle uppercase">{k}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroIllustration />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-16 border-b border-line bg-panel">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeader eyebrow="How it works" title="From orbit to field-level crop maps">
              A four-stage pipeline turns raw multispectral observations into crop type predictions you can inspect on a map.
            </SectionHeader>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="bg-panel p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700"><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
                    <span className="font-mono text-xs text-ink-subtle">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Scope */}
        <section id="scope" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
            <SectionHeader eyebrow="Scope · Version 1" title="Focused on Mysuru district">
              The first version deliberately covers a single district so that training labels, validation and results can be verified carefully before
              expanding. Crop categories below are the intended targets; final support depends on verified ground-truth data.
            </SectionHeader>
            <ul className="grid grid-cols-2 gap-2 self-center sm:grid-cols-4">
              {CROP_CATEGORIES.map((c) => (
                <li key={c.id} className="rounded-md border border-line bg-panel px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c.color }} aria-hidden="true" />
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-subtle">{c.localName}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Technology */}
        <section id="technology" className="scroll-mt-16 border-b border-line bg-brand-900 text-brand-100">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <p className="font-mono text-[11px] tracking-[0.14em] text-brand-300 uppercase">Technology</p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">An end-to-end geospatial AI stack</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {STACK.map(({ group, icon: Icon, items }) => (
                <div key={group} className="bg-brand-900 p-6">
                  <Icon className="h-5 w-5 text-brand-300" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-semibold text-white">{group}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-brand-200">
                    {items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Objectives & impact */}
        <section id="objectives" className="scroll-mt-16 border-b border-line bg-panel">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
            <div>
              <SectionHeader eyebrow="Objectives" title="What the project sets out to do" />
              <ul className="mt-8 space-y-4">
                {OBJECTIVES.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                    <Target className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeader eyebrow="Impact" title="Why it matters" />
              <div className="mt-8 space-y-3">
                {IMPACT.map((i) => (
                  <div key={i.title} className="rounded-lg border border-line p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold"><Sprout className="h-4 w-4 text-brand-600" aria-hidden="true" />{i.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{i.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
            <SectionHeader eyebrow="Project status" title="Built in the open, reported honestly">
              The platform never displays fabricated statistics. Panels show real backend data, or say clearly that data is not yet available.
            </SectionHeader>
            <ul className="grid gap-2 self-center sm:grid-cols-2">
              {STATUS.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 rounded-md border border-line bg-panel px-3 py-2.5 text-sm">
                  {s.done ? <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" /> : <CircleDashed className="h-4 w-4 text-ink-subtle" aria-hidden="true" />}
                  <span className={s.done ? 'text-ink' : 'text-ink-muted'}>{s.label}</span>
                  <span className="sr-only">{s.done ? '(done)' : '(in progress)'}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div className="flex items-center gap-4">
              <span className="hidden h-11 w-11 items-center justify-center rounded-md bg-brand-700 text-white sm:flex"><Workflow className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Explore the platform</h2>
                <p className="mt-1 text-sm text-ink-muted">Draw a field, inspect map layers and see how classification results will be reported.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/app/explorer" className="btn-secondary"><Database className="h-4 w-4" aria-hidden="true" /> Satellite Explorer</Link>
              <Link to="/app" className="btn-primary">Explore Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
