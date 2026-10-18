import { AlertCircle, FolderGit2, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Availability } from '../../features/projects/model/types'

export function AvailabilityBadge({ status }: { status: Availability }) {
  const labels = {
    available: 'Repository available',
    unavailable: 'Repository unavailable',
    'not-verified': 'Not verified',
  }
  return (
    <span className={`badge ${status}`}>
      <span className="status-dot" />
      {labels[status]}
    </span>
  )
}
export function Loading({ label = 'Loading projects…' }: { label?: string }) {
  return (
    <div className="state-box" role="status">
      <LoaderCircle className="spin" size={24} />
      <p>{label}</p>
    </div>
  )
}
export function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="state-box error-state">
      <AlertCircle size={28} />
      <h2>Something needs attention</h2>
      <p role="alert">{error.message}</p>
      <button className="button secondary" onClick={retry}>
        Retry
      </button>
    </div>
  )
}
export function NotFound({ project = false }: { project?: boolean }) {
  return (
    <div className="state-box">
      <FolderGit2 size={32} />
      <h1>{project ? 'Project Not Found' : 'Page Not Found'}</h1>
      <p>
        {project ? 'This project is not in the current workspace.' : 'This page does not exist.'}
      </p>
      <Link className="button secondary" to="/projects">
        Back to Projects
      </Link>
    </div>
  )
}
