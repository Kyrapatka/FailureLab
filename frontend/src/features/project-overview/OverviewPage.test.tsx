import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OverviewContent } from './OverviewPage'
import { demoDataset } from '../../mocks/fixtures'
import { selectOverview } from '../projects/model/project'

describe('Overview presentation', () => {
  it('shows a compact Ready state with active run and disabled future actions', () => {
    render(<OverviewContent overview={selectOverview(demoDataset(), 'demo-auth')!} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.queryByText('Repository usable')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Active experiment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New Experiment' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Configure Environment' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create Scenario' })).toBeDisabled()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
  it('keeps unavailable repository history and explains missing prerequisite', () => {
    render(<OverviewContent overview={selectOverview(demoDataset(), 'demo-order')!} />)
    expect(screen.getByText('Needs Attention')).toBeInTheDocument()
    expect(
      screen.getByText('Repository is unavailable. Existing history remains accessible.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(5)
    expect(screen.queryByText('Token validation')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Active experiment' })).not.toBeInTheDocument()
  })
  it('renders at most three configurations and five runs from oversized input', () => {
    const overview = selectOverview(demoDataset(), 'demo-auth')!
    overview.environments = Array.from({ length: 5 }, (_, i) => ({
      ...overview.environments[0],
      id: `e-${i}`,
      name: `Environment ${i}`,
    }))
    overview.scenarios = Array.from({ length: 5 }, (_, i) => ({
      ...overview.scenarios[0],
      id: `s-${i}`,
      name: `Scenario ${i}`,
    }))
    overview.runs = Array.from({ length: 8 }, (_, i) => ({
      ...overview.runs[0],
      id: `run-${i}`,
      scenarioId: 's-0',
      createdAt: `2026-10-0${i + 1}T10:00:00Z`,
    }))
    render(<OverviewContent overview={overview} />)
    expect(
      within(screen.getByRole('list', { name: 'Environments' })).getAllByRole('listitem'),
    ).toHaveLength(3)
    expect(
      within(screen.getByRole('list', { name: 'Scenarios' })).getAllByRole('listitem'),
    ).toHaveLength(3)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(6)
    expect(rows[1]).toHaveTextContent('run-7')
    expect(rows[5]).toHaveTextContent('run-3')
  })
  it('returns to a detailed checklist when a usable configuration is lost', () => {
    const overview = selectOverview(demoDataset(), 'demo-auth')!
    const { rerender } = render(<OverviewContent overview={overview} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    rerender(
      <OverviewContent
        overview={{
          ...overview,
          scenarios: overview.scenarios.map((s) => ({ ...s, usable: false })),
        }}
      />,
    )
    expect(screen.getByText('Setup Required')).toBeInTheDocument()
    expect(screen.getByText('Scenario configured')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
  })
})
