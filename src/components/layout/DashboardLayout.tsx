import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BackendStatusBanner } from '@/components/ui'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { GlobalSearch } from './GlobalSearch'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setSidebarOpen(false), [pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        <BackendStatusBanner />
        <main id="main" className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-line bg-panel px-4 py-2.5 sm:hidden">
            <GlobalSearch />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
