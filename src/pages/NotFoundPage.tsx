import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <p className="eyebrow mt-6">404 · Outside the mapped extent</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">The page you are looking for does not exist.</p>
      <div className="flex gap-2">
        <Link to="/" className="btn-secondary">Home</Link>
        <Link to="/app" className="btn-primary">Open dashboard</Link>
      </div>
    </div>
  )
}
