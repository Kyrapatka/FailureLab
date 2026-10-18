export type Availability = 'available' | 'unavailable' | 'not-verified'
export type RunStatus = 'Preparing' | 'Running' | 'Completed' | 'Failed' | 'Cancelled'
export interface Project {
  id: string
  name: string
  repositoryPath: string
  availability: Availability
  createdAt: string
  branch?: string
}
export interface Configuration {
  id: string
  projectId: string
  name: string
  description: string
  usable: boolean
}
export interface Run {
  id: string
  projectId: string
  scenarioId: string
  revision: string
  status: RunStatus
  createdAt: string
}
export interface Dataset {
  projects: Project[]
  environments: Configuration[]
  scenarios: Configuration[]
  runs: Run[]
}
export interface Overview {
  project: Project
  environments: Configuration[]
  scenarios: Configuration[]
  runs: Run[]
}
export interface CreateProjectInput {
  repositoryPath: string
  name: string
}
export interface ProjectsApi {
  listProjects(): Promise<(Project & { runCount: number })[]>
  getOverview(id: string): Promise<Overview | null>
  createProject(input: CreateProjectInput): Promise<Project>
  resetUserData(): Promise<void>
}
