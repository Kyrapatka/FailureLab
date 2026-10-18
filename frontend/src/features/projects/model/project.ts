import type { CreateProjectInput, Dataset, Overview } from './types'

export function normalizePath(value: string): string {
  const path = value.trim()
  if (!path) throw new Error('Repository path is required.')
  if (Array.from(path).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) {
    throw new Error('Repository path cannot contain control characters.')
  }
  const windows = /^[A-Za-z]:[\\/]/.test(path)
  if (
    (!windows && !path.startsWith('/')) ||
    path.startsWith('//') ||
    (!windows && path.includes('\\'))
  ) {
    throw new Error('Use an absolute Unix path or a Windows drive path, such as C:\\projects\\api.')
  }
  if (windows && path.includes('\\') && path.includes('/'))
    throw new Error('Use one separator style in a Windows path.')
  const normalized = path.replaceAll('\\', '/').replace(/\/+$/, '')
  const parts = normalized.slice(windows ? 3 : 1).split('/')
  if (!parts.length || parts.some((p) => !p || p === '.' || p === '..' || p.trim() !== p)) {
    throw new Error(
      'Use a project directory, without empty segments, dot segments, or ambiguous spaces.',
    )
  }
  if (
    windows &&
    parts.some(
      (p) =>
        /[<>:"|?*]/.test(p) ||
        p.endsWith('.') ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p),
    )
  ) {
    throw new Error('This Windows path contains an unsupported directory name.')
  }
  return normalized
}

export function projectName(input: CreateProjectInput): string {
  const path = normalizePath(input.repositoryPath)
  return input.name.trim() || path.slice(path.lastIndexOf('/') + 1)
}

export function selectOverview(data: Dataset, id: string): Overview | null {
  const project = data.projects.find((p) => p.id === id)
  if (!project) return null
  return {
    project,
    environments: data.environments.filter((e) => e.projectId === id),
    scenarios: data.scenarios.filter((s) => s.projectId === id),
    runs: data.runs.filter((r) => r.projectId === id),
  }
}

export function readiness(overview: Overview) {
  const checks = [
    overview.project.availability === 'available',
    overview.environments.some((e) => e.usable),
    overview.scenarios.some((s) => s.usable),
  ]
  const label = checks.every(Boolean)
    ? 'Ready'
    : overview.project.availability === 'unavailable'
      ? 'Needs Attention'
      : 'Setup Required'
  return { label, checks }
}

export function previews(
  overview: Overview,
): Pick<Overview, 'environments' | 'scenarios' | 'runs'> {
  return {
    environments: overview.environments.slice(0, 3),
    scenarios: overview.scenarios.slice(0, 3),
    runs: [...overview.runs]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id))
      .slice(0, 5),
  }
}
