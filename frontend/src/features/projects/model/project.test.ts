import { describe, expect, it } from 'vitest'
import { normalizePath, previews, projectName, readiness, selectOverview } from './project'
import type { Dataset, Overview } from './types'

export function overviewFixture(): Overview {
  return {
    project: {
      id: 'p',
      name: 'api',
      repositoryPath: '/repos/api',
      availability: 'available',
      createdAt: '2026-10-01T00:00:00Z',
    },
    environments: [
      { id: 'env', projectId: 'p', name: 'Local', description: 'Compose', usable: true },
    ],
    scenarios: [{ id: 'sc', projectId: 'p', name: 'Load', description: 'HTTP', usable: true }],
    runs: [
      {
        id: 'r',
        projectId: 'p',
        scenarioId: 'sc',
        revision: 'abc1234',
        status: 'Failed',
        createdAt: '2026-10-02T00:00:00Z',
      },
    ],
  }
}

describe('path and naming contract', () => {
  it.each([
    [' /home/dev/payment-api/// ', '/home/dev/payment-api'],
    [' C:\\Users\\dev\\api\\ ', 'C:/Users/dev/api'],
    ['D:/my repos/auth/', 'D:/my repos/auth'],
  ])('normalizes %s textually', (input, expected) => expect(normalizePath(input)).toBe(expected))
  it.each([
    '',
    '   ',
    'relative/api',
    'C:api',
    '/',
    'C:\\',
    '//server/share',
    '/a/../b',
    '/a/./b',
    '/a//b',
    'https://host/api',
    '/a\u0000b',
  ])('rejects ambiguous path %j', (input) => expect(() => normalizePath(input)).toThrow())
  it('preserves case for textual duplicate comparison', () =>
    expect(normalizePath('/Repos/API')).not.toBe(normalizePath('/repos/api')))
  it('uses directory basename when name is blank', () =>
    expect(projectName({ repositoryPath: 'C:\\dev\\payment-api\\', name: ' ' })).toBe(
      'payment-api',
    ))
  it('trims and prioritizes custom name', () =>
    expect(projectName({ repositoryPath: '/repos/api', name: ' My API ' })).toBe('My API'))
})

describe('overview contract', () => {
  it('derives Ready even when a previous run failed', () =>
    expect(readiness(overviewFixture()).label).toBe('Ready'))
  it('requires usable configurations', () => {
    const data = overviewFixture()
    data.environments[0].usable = false
    expect(readiness(data).label).toBe('Setup Required')
  })
  it('never treats an unverified repository as ready', () => {
    const data = overviewFixture()
    data.project.availability = 'not-verified'
    expect(readiness(data).checks[0]).toBe(false)
    expect(readiness(data).label).toBe('Setup Required')
  })
  it('explains lost prerequisites as Needs Attention', () => {
    const data = overviewFixture()
    data.project.availability = 'unavailable'
    expect(readiness(data).label).toBe('Needs Attention')
  })
  it('caps previews and sorts newest runs first without mutating input', () => {
    const data = overviewFixture()
    data.environments = Array.from({ length: 5 }, (_, i) => ({
      ...data.environments[0],
      id: `e${i}`,
    }))
    data.scenarios = Array.from({ length: 5 }, (_, i) => ({ ...data.scenarios[0], id: `s${i}` }))
    data.runs = Array.from({ length: 8 }, (_, i) => ({
      ...data.runs[0],
      id: `r${i}`,
      createdAt: `2026-10-0${i + 1}T00:00:00Z`,
    }))
    const result = previews(data)
    expect(result.environments).toHaveLength(3)
    expect(result.scenarios).toHaveLength(3)
    expect(result.runs.map((r) => r.id)).toEqual(['r7', 'r6', 'r5', 'r4', 'r3'])
    expect(data.runs[0].id).toBe('r0')
  })
  it('isolates all related data by projectId and handles missing IDs', () => {
    const overview = overviewFixture()
    const data: Dataset = {
      projects: [overview.project],
      environments: [
        ...overview.environments,
        { ...overview.environments[0], id: 'other-e', projectId: 'other' },
      ],
      scenarios: overview.scenarios,
      runs: [...overview.runs, { ...overview.runs[0], id: 'other-r', projectId: 'other' }],
    }
    expect(selectOverview(data, 'p')?.runs.map((r) => r.id)).toEqual(['r'])
    expect(selectOverview(data, 'p')?.environments).toHaveLength(1)
    expect(selectOverview(data, 'missing')).toBeNull()
  })
  it('uses an ID tie-breaker for equal timestamps', () => {
    const data = overviewFixture()
    data.runs = ['z', 'a', 'm'].map((id) => ({ ...data.runs[0], id }))
    expect(previews(data).runs.map((run) => run.id)).toEqual(['a', 'm', 'z'])
  })
})
