import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderGit2, Search } from 'lucide-react'
import type { ProjectsApi } from '../model/types'
import { AddProject } from '../components/AddProject'
import { AvailabilityBadge, ErrorState, Loading } from '../../../shared/ui/States'

export function ProjectsPage({ api, demo }: { api: ProjectsApi; demo: boolean }) {
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() })
  const projects = query.data ?? []
  const filtered = projects.filter((p) =>
    `${p.name}\n${p.repositoryPath}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  return (
    <>
      <title>Projects · FailureLab</title>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>Projects</h1>
          <p>Reproducible experiments start with a repository.</p>
        </div>
        <AddProject api={api} />
      </div>
      <div className="section-toolbar">
        <div className="section-label">
          Connected repositories <span className="count">{projects.length}</span>
        </div>
        <div className="search-input">
          <Search size={16} />
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search by name or path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch()
          }}
        />
      ) : projects.length === 0 ? (
        <div className="empty-projects">
          <div className="empty-icon">
            <FolderGit2 size={30} strokeWidth={1.5} />
          </div>
          <h2>No projects yet</h2>
          <p>
            Connect a local Git repository to create your first
            <br className="desktop-break" /> experiment workspace.
          </p>
          <div className="empty-guidance">
            Start with <strong>Add Project</strong> above, or explore a demo.
          </div>
          {!demo && (
            <a href="/projects?demo=1" className="text-link">
              Explore demo projects <ArrowRight size={15} />
            </a>
          )}
          <div className="empty-note">Your source repository stays untouched.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          <Search size={28} />
          <h2>No Search Results</h2>
          <p>No projects match “{search}”. Try a different name or path.</p>
          <button className="button secondary" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      ) : (
        <ul className="project-list" aria-label="Projects">
          {filtered.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`} className="project-row">
                <div className="project-icon">
                  <FolderGit2 size={22} />
                </div>
                <div className="project-detail">
                  <h2>{project.name}</h2>
                  <code>{project.repositoryPath}</code>
                </div>
                <div className="project-status">
                  <AvailabilityBadge status={project.availability} />
                  <span>
                    {project.runCount} {project.runCount === 1 ? 'experiment' : 'experiments'}
                  </span>
                </div>
                <ArrowRight className="row-arrow" size={17} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="workspace-note">
        <span className="status-dot" />
        Local workspace <span>·</span>{' '}
        {demo ? 'Sample data, separate from your projects' : 'Projects are saved in this browser'}
      </div>
    </>
  )
}
