import { z } from 'zod'
import type { Dataset } from '../features/projects/model/types'
import { normalizePath } from '../features/projects/model/project'
import { emptyDataset } from './fixtures'

export const STORAGE_KEY = 'failurelab.projects.v1'
export class StorageError extends Error {}
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const text = z.string().trim().min(1)
const configuration = z.object({
  id: text,
  projectId: text,
  name: text,
  description: text,
  usable: z.boolean(),
})
const schema = z.object({
  version: z.literal(1),
  data: z.object({
    projects: z.array(
      z.object({
        id: text,
        name: text,
        repositoryPath: text,
        availability: z.enum(['available', 'unavailable', 'not-verified']),
        createdAt: z.iso.datetime(),
        branch: text.optional(),
      }),
    ),
    environments: z.array(configuration),
    scenarios: z.array(configuration),
    runs: z.array(
      z.object({
        id: text,
        projectId: text,
        scenarioId: text,
        revision: text,
        status: z.enum(['Preparing', 'Running', 'Completed', 'Failed', 'Cancelled']),
        createdAt: z.iso.datetime(),
      }),
    ),
  }),
})

function validateRelations(data: Dataset) {
  for (const records of [data.projects, data.environments, data.scenarios, data.runs]) {
    if (new Set(records.map((r) => r.id)).size !== records.length) throw new Error('Duplicate IDs')
  }
  const paths = data.projects.map((p) => normalizePath(p.repositoryPath))
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate paths')
  const projectIds = new Set(data.projects.map((p) => p.id))
  if (
    [...data.environments, ...data.scenarios, ...data.runs].some(
      (r) => !projectIds.has(r.projectId),
    )
  )
    throw new Error('Missing project')
  if (
    data.runs.some(
      (r) => !data.scenarios.some((s) => s.id === r.scenarioId && s.projectId === r.projectId),
    )
  )
    throw new Error('Invalid scenario ownership')
}

export function projectStorage(provided?: StoragePort) {
  const port = () => provided ?? window.localStorage
  return {
    read(): Dataset {
      let raw: string | null
      try {
        raw = port().getItem(STORAGE_KEY)
      } catch {
        throw new StorageError(
          'Cannot read local storage. Allow browser storage and retry. Your data has not been changed.',
        )
      }
      if (raw === null) return emptyDataset()
      try {
        const { data } = schema.parse(JSON.parse(raw))
        validateRelations(data)
        return data
      } catch {
        throw new StorageError(
          'Stored data could not be read or uses an unsupported schema. It has been preserved. Restore a valid backup and retry, or explicitly reset local data.',
        )
      }
    },
    write(data: Dataset) {
      try {
        port().setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }))
      } catch {
        throw new StorageError(
          'Could not save project. Browser storage may be full or unavailable. Free space or allow storage, then retry.',
        )
      }
    },
    reset() {
      try {
        port().removeItem(STORAGE_KEY)
      } catch {
        throw new StorageError('Could not reset local storage. Allow browser storage and retry.')
      }
    },
  }
}
