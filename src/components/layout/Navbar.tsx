import { MapPinned, Menu, UserRound } from 'lucide-react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { GlobalSearch } from './GlobalSearch'

interface NavbarProps {
  onOpenSidebar: () => void
}

/** Top bar of the dashboard: region context, search and (placeholder) user profile. */
export function Navbar({ onOpenSidebar }: NavbarProps) {
  const { region } = useWorkspace()
  return (
    <header className="sticky top-0 z-[1000] flex h-16 items-center gap-3 border-b border-line bg-panel/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="-ml-1 rounded-md p-2 text-ink-muted hover:bg-surface lg:hidden"
        aria-label="Open navigation"
        aria-controls="app-sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <span className="font-semibold tracking-tight text-brand-900 lg:hidden">KrishiDrishti</span>

      <div className="hidden items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 md:flex" title="Selected region">
        <MapPinned className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
        <span className="text-xs text-ink-muted">Region</span>
        <span className="text-xs font-semibold text-ink">{region.name}</span>
        <span className="font-mono text-[10px] text-ink-subtle">KA · IN</span>
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-3">
        <div className="hidden flex-1 justify-end sm:flex">
          <GlobalSearch />
        </div>
        <div
          className="flex items-center gap-2 rounded-md border border-line px-2 py-1"
          title="Authentication is not implemented yet"
          aria-label="Guest user — authentication not implemented yet"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-100 text-brand-700">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden text-left leading-tight xl:block">
            <span className="block text-xs font-medium text-ink">Guest</span>
            <span className="block text-[10px] text-ink-subtle">Sign-in not available</span>
          </span>
        </div>
      </div>
    </header>
  )
}
