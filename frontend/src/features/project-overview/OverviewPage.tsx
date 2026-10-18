import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Circle,
  FlaskConical,
  GitBranch,
  Layers,
  Play,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react'
import type { Configuration, Overview, ProjectsApi, RunStatus } from '../projects/model/types'
import { previews, readiness } from '../projects/model/project'
import { AvailabilityBadge, ErrorState, Loading, NotFound } from '../../shared/ui/States'

export function OverviewPage({ api }: { api: ProjectsApi }) {
  const { projectId = '' } = useParams()
  const query = useQuery({
    queryKey: ['overview', projectId],
    queryFn: () => api.getOverview(projectId),
  })
  if (query.isPending) return <Loading label="Loading project…" />
  if (query.isError)
    return (
      <ErrorState
        error={query.error}
        retry={() => {
          void query.refetch()
        }}
      />
    )
  if (!query.data) return <NotFound project />
  return <OverviewContent overview={query.data} />
}

export function OverviewContent({ overview }: { overview: Overview }) {
  const { project } = overview
  const preview = previews(overview)
  const active = [...overview.runs]
    .filter((run) => run.status === 'Running' || run.status === 'Preparing')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
  return (
    <>
      <title>{project.name} · FailureLab</title>
      <header className="overview-heading">
        <div className="eyebrow">PROJECT WORKSPACE</div>
        <div className="title-line">
          <h1>{project.name}</h1>
          <AvailabilityBadge status={project.availability} />
        </div>
        <code className="repository-path">{project.repositoryPath}</code>
        {project.branch && (
          <span className="branch">
            <GitBranch size={14} />
            {project.branch}
            <span className="muted">Repository HEAD · mock</span>
          </span>
        )}
      </header>
      <nav className="workspace-tabs" aria-label="Project sections">
        <span aria-current="page">Overview</span>
        {['Environments', 'Scenarios', 'Experiments'].map((tab) => (
          <button key={tab} disabled title="Available in a future MVP">
            {tab}
            <span className="soon">Soon</span>
          </button>
        ))}
      </nav>
      <Readiness overview={overview} />
      <section className="quick-actions" aria-label="Quick actions">
        <div className="quick-heading">
          <h2>Quick actions</h2>
          <p>Available in a future MVP. No infrastructure operations are performed.</p>
        </div>
        <div className="action-buttons">
          <button className="button primary" disabled>
            <Play size={15} />
            New Experiment
          </button>
          <button className="button secondary" disabled>
            <SlidersHorizontal size={15} />
            Configure Environment
          </button>
          <button className="button secondary" disabled>
            <PlusScenario />
            Create Scenario
          </button>
        </div>
      </section>
      <div className="preview-grid">
        <ConfigurationPreview
          title="Environments"
          noun="environments"
          items={preview.environments}
          total={overview.environments.length}
        />
        <ConfigurationPreview
          title="Scenarios"
          noun="scenarios"
          items={preview.scenarios}
          total={overview.scenarios.length}
        />
      </div>
      {active && (
        <section className="active-experiment">
          <div className="active-icon">
            <Terminal size={20} />
          </div>
          <div>
            <h2>Active experiment</h2>
            <p>
              <code>{active.id}</code>
              <span>·</span>
              {overview.scenarios.find((s) => s.id === active.scenarioId)?.name}
            </p>
            <p className="muted">
              Static demo snapshot. Live execution and run details are not available yet.
            </p>
          </div>
          <RunBadge status={active.status} />
        </section>
      )}
      <section className="panel experiments">
        <div className="panel-heading">
          <div>
            <h2>Recent Experiments</h2>
            <p>The latest runs in this project, newest first.</p>
          </div>
          <span className="count">{overview.runs.length}</span>
        </div>
        {preview.runs.length === 0 ? (
          <div className="preview-empty">
            <FlaskConical size={25} />
            <h3>No experiments yet</h3>
            <p>Your experiment history will appear here.</p>
          </div>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Recent experiments table"
          >
            <table>
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Scenario</th>
                  <th>Revision</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {preview.runs.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <code>{run.id}</code>
                    </td>
                    <td>
                      {overview.scenarios.find((s) => s.id === run.scenarioId)?.name ??
                        'Unknown scenario'}
                    </td>
                    <td>
                      <code className="revision">{run.revision}</code>
                    </td>
                    <td>
                      <RunBadge status={run.status} />
                    </td>
                    <td>
                      <time dateTime={run.createdAt}>{formatTime(run.createdAt)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="overview-footer">
        Project data is isolated to this workspace. Repository status and configurations are
        simulated.
      </p>
    </>
  )
}

function Readiness({ overview }: { overview: Overview }) {
  const state = readiness(overview)
  if (state.label === 'Ready')
    return (
      <section className="readiness ready" aria-label="Project readiness">
        <CheckCircle2 size={21} />
        <div>
          <h2>Ready</h2>
          <p>
            Repository, environment and scenario are configured. Ready to prepare an experiment;
            successful execution is not guaranteed.
          </p>
        </div>
        <span className="readiness-caption">3 / 3 prerequisites</span>
      </section>
    )
  const descriptions = [
    overview.project.availability === 'available'
      ? 'Available in the mock directory catalog.'
      : overview.project.availability === 'unavailable'
        ? 'Repository is unavailable. Existing history remains accessible.'
        : 'This path has not been verified. Repository checks require the future backend.',
    state.checks[1]
      ? 'At least one usable environment is configured.'
      : 'Configure an environment when the editor becomes available.',
    state.checks[2]
      ? 'At least one usable scenario is configured.'
      : 'Create a scenario when the editor becomes available.',
  ]
  return (
    <section className="readiness setup" aria-label="Project readiness">
      <div className="readiness-header">
        <div>
          <h2>{state.label}</h2>
          <p>
            {state.label === 'Needs Attention'
              ? 'Resolve the repository issue before preparing an experiment.'
              : 'A few prerequisites before your first experiment.'}
          </p>
        </div>
        <span className="readiness-caption">
          {state.checks.filter(Boolean).length} / 3 prerequisites
        </span>
      </div>
      <ul className="checklist">
        {['Repository usable', 'Environment configured', 'Scenario configured'].map((label, i) => (
          <li key={label}>
            <span className={state.checks[i] ? 'check done' : 'check'}>
              {state.checks[i] ? <Check size={13} /> : <Circle size={15} />}
            </span>
            <div>
              <h3>{label}</h3>
              <p>{descriptions[i]}</p>
            </div>
            <span className="check-label">{state.checks[i] ? 'Complete' : 'Required'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ConfigurationPreview({
  title,
  noun,
  items,
  total,
}: {
  title: string
  noun: string
  items: Configuration[]
  total: number
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div className="preview-title">
          {noun === 'environments' ? <Layers size={18} /> : <FlaskConical size={18} />}
          <h2>{title}</h2>
          <span className="count">{total}</span>
        </div>
        <span className="muted preview-label">Preview</span>
      </div>
      {items.length === 0 ? (
        <div className="preview-empty">
          <h3>No {noun} yet</h3>
          <p>
            {noun === 'environments'
              ? 'Define where your application will run.'
              : 'Define the conditions for your experiment.'}
          </p>
          <span className="soon-label">Editor coming in a future MVP</span>
        </div>
      ) : (
        <ul className="configuration-list" aria-label={title}>
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <span className={`configuration-status ${item.usable ? 'usable' : ''}`}>
                {item.usable ? 'Usable' : 'Needs setup'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {total > 3 && (
        <p className="preview-limit">Showing 3 of {total}. Full list available in a future MVP.</p>
      )}
    </section>
  )
}

function RunBadge({ status }: { status: RunStatus }) {
  return (
    <span className={`run-badge ${status.toLowerCase()}`}>
      <span className="status-dot" />
      {status}
    </span>
  )
}
function PlusScenario() {
  return <FlaskConical size={15} />
}
function formatTime(value: string) {
  return `${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value))} UTC`
}
