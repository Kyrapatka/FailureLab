import { describe, expect, it } from 'vitest'
import { createProjectsApi } from './api'
import { demoDataset } from '../../../mocks/fixtures'

function memoryStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
    removeItem: () => {
      value = null
    },
  }
}
const input = { name: '', repositoryPath: '/work/api' }

describe('async projects adapter', () => {
  it('starts empty and restores created records through a new adapter', async () => {
    const storage = memoryStorage()
    const api = createProjectsApi({ storage, delayMs: 0 })
    expect(await api.listProjects()).toEqual([])
    const project = await api.createProject(input)
    expect(project).toMatchObject({ name: 'api', availability: 'not-verified' })
    expect((await createProjectsApi({ storage, delayMs: 0 }).listProjects())[0].id).toBe(project.id)
  })
  it('blocks normalized duplicates and concurrent submissions', async () => {
    const api = createProjectsApi({ storage: memoryStorage(), delayMs: 5 })
    const results = await Promise.allSettled([
      api.createProject(input),
      api.createProject({ ...input, repositoryPath: ' /work/api/ ' }),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1)
    expect(await api.listProjects()).toHaveLength(1)
  })
  it('uses known mock status but never invents verification', async () => {
    const api = createProjectsApi({ storage: memoryStorage(), delayMs: 0 })
    expect(
      (await api.createProject({ ...input, repositoryPath: '/home/dev/projects/payment-api' }))
        .availability,
    ).toBe('available')
    expect((await api.createProject(input)).availability).toBe('not-verified')
  })
  it.each(['broken json', '{"version":2,"data":{}}', '{"version":1,"data":{"projects":[]}}'])(
    'preserves corrupt/unsupported data: %s',
    async (raw) => {
      const storage = memoryStorage(raw)
      const api = createProjectsApi({ storage, delayMs: 0 })
      await expect(api.listProjects()).rejects.toThrow(/stored data/i)
      await expect(api.createProject(input)).rejects.toThrow(/stored data/i)
      expect(storage.getItem()).toBe(raw)
      await api.resetUserData()
      expect(await api.listProjects()).toEqual([])
    },
  )
  it('reports failed writes instead of reporting a created project', async () => {
    const storage = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error('quota')
      },
    }
    await expect(createProjectsApi({ storage, delayMs: 0 }).createProject(input)).rejects.toThrow(
      /save/i,
    )
    expect(storage.getItem()).toBeNull()
  })
  it('supports deterministic load and create failure followed by retry', async () => {
    const api = createProjectsApi({
      storage: memoryStorage(),
      delayMs: 0,
      failLoadCount: 1,
      failCreateCount: 1,
    })
    await expect(api.listProjects()).rejects.toThrow(/load/i)
    expect(await api.listProjects()).toEqual([])
    await expect(api.createProject(input)).rejects.toThrow(/create/i)
    expect(await api.listProjects()).toEqual([])
    await api.createProject(input)
    expect(await api.listProjects()).toHaveLength(1)
  })
  it('never writes demo data to user storage', async () => {
    const storage = memoryStorage()
    const demo = createProjectsApi({ seed: demoDataset(), storage, delayMs: 0 })
    expect(await demo.listProjects()).toHaveLength(3)
    await demo.createProject(input)
    expect(await demo.listProjects()).toHaveLength(4)
    expect(storage.getItem()).toBeNull()
    expect(await createProjectsApi({ storage, delayMs: 0 }).listProjects()).toEqual([])
  })
  it('rejects invalid cross-project relations without overwriting the original bytes', async () => {
    const data = demoDataset()
    data.runs[0].scenarioId = 'order-checkout'
    const raw = JSON.stringify({ version: 1, data })
    const storage = memoryStorage(raw)
    await expect(createProjectsApi({ storage, delayMs: 0 }).listProjects()).rejects.toThrow(
      /stored data/i,
    )
    expect(storage.getItem()).toBe(raw)
  })
  it('handles blocked storage reads and resets with clear errors', async () => {
    const storage = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const api = createProjectsApi({ storage, delayMs: 0 })
    await expect(api.listProjects()).rejects.toThrow(/Cannot read local storage/)
    await expect(api.resetUserData()).rejects.toThrow(/Could not reset/)
  })
})
