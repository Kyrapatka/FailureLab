import type { Dataset, Project, ProjectsApi } from '../model/types'
import { normalizePath, projectName, selectOverview } from '../model/project'
import { demoDirectories, emptyDataset } from '../../../mocks/fixtures'
import { projectStorage } from '../../../mocks/storage'
export interface ApiOptions {
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  seed?: Dataset
  delayMs?: number
  failLoadCount?: number
  failCreateCount?: number
}
export class DuplicatePathError extends Error {}

export function createProjectsApi(options: ApiOptions = {}): ProjectsApi {
  const storage = projectStorage(options.storage)
  let memory = options.seed ? structuredClone(options.seed) : null
  let loadFailures = options.failLoadCount ?? 0
  let createFailures = options.failCreateCount ?? 0
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, options.delayMs ?? 250))
  const read = () => memory ?? storage.read()
  const load = async () => {
    await wait()
    if (loadFailures > 0) {
      loadFailures--
      throw new Error('Could not load projects (simulated error). Please retry.')
    }
    return read()
  }
  return {
    async listProjects() {
      const data = await load()
      return structuredClone(
        data.projects.map((p) => ({
          ...p,
          runCount: data.runs.filter((r) => r.projectId === p.id).length,
        })),
      )
    },
    async getOverview(id) {
      return structuredClone(selectOverview(await load(), id))
    },
    async createProject(input) {
      await wait()
      if (createFailures > 0) {
        createFailures--
        throw new Error(
          'Could not create project (simulated error). Your fields are preserved; please retry.',
        )
      }
      const repositoryPath = normalizePath(input.repositoryPath)
      // Read/check/write is synchronous after the delay: concurrent submissions
      // in this browser context cannot both pass the duplicate check.
      const data = read()
      if (data.projects.some((p) => normalizePath(p.repositoryPath) === repositoryPath)) {
        throw new DuplicatePathError('This repository path is already registered.')
      }
      const project: Project = {
        id: crypto.randomUUID(),
        name: projectName(input),
        repositoryPath,
        availability:
          demoDirectories.find((d) => d.path === repositoryPath)?.availability ?? 'not-verified',
        createdAt: new Date().toISOString(),
      }
      const updated = { ...data, projects: [...data.projects, project] }
      if (memory) memory = updated
      else storage.write(updated)
      return structuredClone(project)
    },
    async resetUserData() {
      await wait()
      if (memory) memory = emptyDataset()
      else storage.reset()
    },
  }
}
