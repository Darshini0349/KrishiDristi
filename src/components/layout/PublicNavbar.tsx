import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui'

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#technology', label: 'Technology' },
  { href: '#objectives', label: 'Objectives' },
  { href: '#scope', label: 'Scope' },
]

export function PublicNavbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="KrishiDrishti home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/app" className="btn-primary hidden sm:inline-flex">
            Explore Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button type="button" className="rounded-md p-2 text-ink-muted hover:bg-panel md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-panel px-4 py-3 md:hidden" aria-label="Primary mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm text-ink-muted hover:bg-surface">
              {l.label}
            </a>
          ))}
          <Link to="/app" className="btn-primary mt-2 w-full">Explore Dashboard</Link>
        </nav>
      )}
    </header>
  )
}
