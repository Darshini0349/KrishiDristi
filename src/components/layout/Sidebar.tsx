import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { Logo } from '@/components/ui'
import { useBackendStatus } from '@/context/BackendStatusContext'
import { env } from '@/config/env'
import { DASHBOARD_NAV } from './navigation'

interface SidebarProps {
  /** Mobile drawer state; ignored on large screens where the sidebar is always visible. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { state } = useBackendStatus()
  const status = {
    checking: { dot: 'bg-brand-300 animate-pulse', text: 'Checking backend…' },
    online: { dot: 'bg-[#6fd19a]', text: 'Backend connected' },
    offline: { dot: 'bg-[#e0b44a]', text: 'Backend offline' },
  }[state]

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-[1100] bg-brand-950/40 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-[1200] flex w-64 flex-col bg-brand-900 text-brand-100 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
          <NavLink to="/" onClick={onClose} aria-label="KrishiDrishti home">
            <Logo tone="light" />
          </NavLink>
          <button type="button" className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 font-mono text-[10px] tracking-[0.16em] text-brand-400 uppercase">Workspace</p>
          <ul className="space-y-0.5">
            {DASHBOARD_NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/app'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-white/10 font-medium text-white' : 'text-brand-200 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`h-4 w-0.5 rounded-full ${isActive ? 'bg-brand-300' : 'bg-transparent'}`} aria-hidden="true" />
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-white/8 px-5 py-4 text-xs">
          <div className="flex items-center gap-2 text-brand-200">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
            {status.text}
          </div>
          <div className="font-mono text-[10.5px] leading-relaxed text-brand-400">
            Scope · Mysuru, Karnataka
            <br />
            Sensor · Sentinel-2 MSI
            <br />
            Frontend v{env.appVersion}
          </div>
        </div>
      </aside>
    </>
  )
}
