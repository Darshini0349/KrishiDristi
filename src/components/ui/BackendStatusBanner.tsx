import { PlugZap, RotateCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBackendStatus } from '@/context/BackendStatusContext'

/** Development-mode notice shown while the FastAPI backend is unreachable. */
export function BackendStatusBanner() {
  const { state, baseUrl, recheck } = useBackendStatus()
  if (state !== 'offline') return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#ecd9a6] bg-warn-50 px-4 py-2 text-xs text-warn-600 sm:px-6">
      <PlugZap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="font-semibold">Development mode<span className="hidden sm:inline"> — backend not connected</span>.</span>
      <span className="hidden text-[#7a5a12] md:inline">
        No API at <code className="font-mono">{baseUrl}</code>. Map tools work; data panels will stay empty until the FastAPI service is running.
      </span>
      <span className="ml-auto flex items-center gap-3">
        <button type="button" onClick={recheck} className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
          <RotateCw className="h-3 w-3" aria-hidden="true" /> Retry
        </button>
        <Link to="/app/settings" className="font-medium underline-offset-2 hover:underline">Configure</Link>
      </span>
    </div>
  )
}
