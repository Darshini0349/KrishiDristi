import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BackendStatusProvider } from '@/context/BackendStatusContext'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingIndicator } from '@/components/ui'

// Route-level code splitting keeps the landing page free of map/chart bundles.
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const OverviewPage = lazy(() => import('@/pages/OverviewPage'))
const ClassificationPage = lazy(() => import('@/pages/ClassificationPage'))
const SatelliteExplorerPage = lazy(() => import('@/pages/SatelliteExplorerPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <BrowserRouter>
      <BackendStatusProvider>
        <WorkspaceProvider>
          <Suspense fallback={<div className="h-dvh"><LoadingIndicator block /></div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="classify" element={<ClassificationPage />} />
                <Route path="explorer" element={<SatelliteExplorerPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </WorkspaceProvider>
      </BackendStatusProvider>
    </BrowserRouter>
  )
}
