import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { createProjectsApi, type ApiOptions } from '../features/projects/data/api'
import { demoDataset } from '../mocks/fixtures'

function mount(options: ApiOptions = {}, route = '/projects') {
  const api = createProjectsApi({
    seed: { projects: [], environments: [], scenarios: [], runs: [] },
    delayMs: 0,
    ...options,
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <MemoryRouter initialEntries={[route]}>
        <App api={api} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { api, user: userEvent.setup() }
}

describe('Projects and Add Project behavior', () => {
  it('shows empty state and cancel leaves it unchanged', async () => {
    const { user, api } = mount()
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Project' }))
    expect(screen.getByRole('dialog', { name: 'Add Project' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await api.listProjects()).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Add Project' })).toHaveFocus()
  })
  it('validates empty path, selects mock directory, keeps custom name and navigates', async () => {
    const { user } = mount()
    await user.click(await screen.findByRole('button', { name: 'Add Project' }))
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(await screen.findByText('Repository path is required.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Project name'), 'Custom payments')
    await user.click(screen.getByRole('button', { name: 'Browse' }))
    expect(screen.getByText('Demo directories')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /payment-api/ }))
    expect(screen.getByLabelText('Repository path')).toHaveValue('/home/dev/projects/payment-api')
    expect(screen.getByLabelText('Project name')).toHaveValue('Custom payments')
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(
      await screen.findByRole('heading', { name: 'Custom payments', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Setup Required')).toBeInTheDocument()
    expect(screen.getByText('No environments yet')).toBeInTheDocument()
    expect(screen.getByText('No scenarios yet')).toBeInTheDocument()
  })
  it('preserves fields after a create error and permits retry, blocking pending submits', async () => {
    const { user, api } = mount({ failCreateCount: 1, delayMs: 40 })
    await user.click(await screen.findByRole('button', { name: 'Add Project' }))
    await user.type(screen.getByLabelText('Repository path'), '/work/api')
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/create/i)
    expect(screen.getByLabelText('Repository path')).toHaveValue('/work/api')
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    const pending = screen.getByRole('button', { name: 'Creating…' })
    expect(pending).toBeDisabled()
    fireEvent.submit(pending.closest('form')!)
    expect(await screen.findByRole('heading', { name: 'api', level: 1 })).toBeInTheDocument()
    expect(await api.listProjects()).toHaveLength(1)
  })
  it('displays a load error and recovers on Retry', async () => {
    const { user } = mount({ failLoadCount: 1 })
    expect(await screen.findByRole('alert')).toHaveTextContent(/load/i)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
  })
  it('handles unknown projects', async () => {
    mount({}, '/projects/missing')
    expect(await screen.findByRole('heading', { name: 'Project Not Found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
  })
  it('shows loading separately from empty state', async () => {
    mount({ delayMs: 60 })
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects')
    expect(screen.queryByText('No projects yet')).not.toBeInTheDocument()
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
  })
  it('rejects duplicates beside the field and keeps custom names through path edits', async () => {
    const { user, api } = mount({ seed: demoDataset() })
    await user.click(await screen.findByRole('button', { name: 'Add Project' }))
    await user.type(screen.getByLabelText('Repository path'), '/home/dev/projects/payment-api/')
    expect(screen.getByLabelText('Project name')).toHaveValue('payment-api')
    await user.clear(screen.getByLabelText('Project name'))
    await user.type(screen.getByLabelText('Project name'), 'My custom project')
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(
      await screen.findByText('This repository path is already registered.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Repository path')).toHaveAttribute('aria-invalid', 'true')
    await user.clear(screen.getByLabelText('Repository path'))
    await user.type(screen.getByLabelText('Repository path'), '/work/different')
    expect(screen.getByLabelText('Project name')).toHaveValue('My custom project')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await api.listProjects()).toHaveLength(3)
  })
  it('filters names and paths without deleting projects', async () => {
    const { user, api } = mount()
    await api.createProject({ name: 'Payments', repositoryPath: '/work/checkout' })
    await api.createProject({ name: 'Identity', repositoryPath: '/work/auth' })
    // Refresh via remount-independent query invalidation is exercised by the UI flow below.
    await user.click(await screen.findByRole('button', { name: 'Add Project' }))
    await user.type(screen.getByLabelText('Repository path'), '/work/third')
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    await screen.findByRole('heading', { name: 'third', level: 1 })
    await user.click(screen.getByRole('link', { name: 'All projects' }))
    const search = await screen.findByRole('searchbox')
    await user.type(search, 'CHECKOUT')
    expect(screen.getByRole('link', { name: /Payments/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Identity/ })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'missing')
    expect(screen.getByText('No Search Results')).toBeInTheDocument()
    expect(screen.queryByText('No projects yet')).not.toBeInTheDocument()
    expect(await api.listProjects()).toHaveLength(3)
    await user.clear(search)
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Projects' })).getAllByRole('listitem'),
      ).toHaveLength(3),
    )
  })
})
