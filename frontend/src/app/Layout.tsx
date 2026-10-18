import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  FlaskConical,
  FolderGit2,
  LayoutGrid,
  Monitor,
  RotateCcw,
} from 'lucide-react'
import type { ProjectsApi } from '../features/projects/model/types'
import { Dialog } from '../shared/ui/Dialog'

export function Layout({ api, demo }: { api: ProjectsApi; demo: boolean }) {
  const match = useMatch('/projects/:projectId')
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() })
  const current = query.data?.find((p) => p.id === match?.params.projectId)
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/projects">
          <span className="brand-mark">
            <FlaskConical size={23} />
          </span>
          FailureLab<span className="version">LOCAL</span>
        </Link>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <Link className="nav-item selected" to="/projects">
            <LayoutGrid size={17} />
            Projects
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-indicator">
            <Monitor size={15} />
            <span>Local instance</span>
            <span className="status-dot" />
          </div>
          <span className="sidebar-footnote">Frontend preview · MVP-01</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <FolderGit2 size={15} />
            <Link to="/projects">Projects</Link>
            {match && (
              <>
                <ChevronRight size={14} />
                <span>{current?.name ?? 'Project workspace'}</span>
              </>
            )}
          </div>
          <span className="mock-label">
            <span className="status-dot" />
            Mock mode
          </span>
        </header>
        {demo && (
          <div className="demo-banner">
            <div>
              <strong>Demo workspace</strong>
              <span>Sample data. Changes reset on reload; your saved projects are separate.</span>
            </div>
            <a href="/projects">Exit demo</a>
          </div>
        )}
        {match && (
          <div className="workspace-toolbar">
            <Link to="/projects" className="back-link">
              <ArrowLeft size={15} />
              All projects
            </Link>
            {query.data && (
              <label className="project-switcher">
                <span>Project</span>
                <select
                  aria-label="Switch project"
                  value={current?.id ?? ''}
                  onChange={(event) => navigate(`/projects/${event.target.value}`)}
                >
                  <option value="" disabled>
                    Select project
                  </option>
                  {query.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            FailureLab <span className="muted">/</span> Frontend MVP-01
          </span>
          {!demo && <ResetData api={api} />}
        </footer>
      </div>
    </div>
  )
}

function ResetData({ api }: { api: ProjectsApi }) {
  const [open, setOpen] = useState(false)
  const client = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: () => api.resetUserData(),
    onSuccess: async () => {
      await client.cancelQueries()
      client.removeQueries({ queryKey: ['overview'] })
      await client.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
      navigate('/projects')
    },
  })
  return (
    <Dialog
      title="Reset local data?"
      description="This removes FailureLab projects saved in this browser. It never deletes repositories or files. This cannot be undone."
      open={open}
      busy={mutation.isPending}
      onOpenChange={(next) => {
        mutation.reset()
        setOpen(next)
      }}
      trigger={
        <button className="reset-link">
          <RotateCcw size={13} />
          Reset local data
        </button>
      }
    >
      {mutation.isError && (
        <p role="alert" className="form-error">
          {mutation.error.message}
        </p>
      )}
      <div className="dialog-actions">
        <button
          className="button secondary"
          disabled={mutation.isPending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
        <button
          className="button danger"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Resetting…' : 'Confirm reset'}
        </button>
      </div>
    </Dialog>
  )
}
