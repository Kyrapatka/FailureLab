import type {
  Availability,
  Configuration,
  Dataset,
  Run,
  RunStatus,
} from '../features/projects/model/types'

export const demoDirectories: { name: string; path: string; availability: Availability }[] = [
  { name: 'payment-api', path: '/home/dev/projects/payment-api', availability: 'available' },
  { name: 'auth-service', path: '/home/dev/projects/auth-service', availability: 'available' },
  { name: 'order-service', path: '/home/dev/projects/order-service', availability: 'unavailable' },
]

const config = (
  id: string,
  projectId: string,
  name: string,
  description: string,
  usable = true,
): Configuration => ({ id, projectId, name, description, usable })
const runs = (
  projectId: string,
  prefix: string,
  scenarios: string[],
  statuses: RunStatus[],
): Run[] =>
  statuses.map((status, i) => ({
    id: `${prefix}-run-${101 + i}`,
    projectId,
    scenarioId: scenarios[i % scenarios.length],
    revision: ['f3a82c1', '7b4e9d2', 'a91c0f6', 'd42b8e1', 'e8a31b7'][i],
    status,
    createdAt: `2026-10-${String(12 + i).padStart(2, '0')}T10:30:00Z`,
  }))

export function demoDataset(): Dataset {
  return {
    projects: demoDirectories.map((d, i) => ({
      id: ['demo-payment', 'demo-auth', 'demo-order'][i],
      name: d.name,
      repositoryPath: d.path,
      availability: d.availability,
      branch: i === 1 ? 'feature/token-cache' : 'main',
      createdAt: '2026-10-10T09:00:00Z',
    })),
    environments: [
      config('auth-local', 'demo-auth', 'Local development', 'Docker Compose · PostgreSQL + Redis'),
      config('auth-isolated', 'demo-auth', 'Isolated baseline', 'Docker Compose · PostgreSQL'),
      config(
        'order-local',
        'demo-order',
        'Order baseline',
        'Docker Compose · PostgreSQL + RabbitMQ',
      ),
    ],
    scenarios: [
      config(
        'auth-token',
        'demo-auth',
        'Token validation',
        'Steady load · 50 virtual users · 2 minutes',
      ),
      config('auth-login', 'demo-auth', 'Login burst', 'Spike test · 200 virtual users · 1 minute'),
      config(
        'auth-refresh',
        'demo-auth',
        'Session refresh',
        'Soak test · 20 virtual users · 10 minutes',
      ),
      config(
        'order-checkout',
        'demo-order',
        'Checkout flow',
        'Steady load · 30 virtual users · 3 minutes',
      ),
      config(
        'order-stock',
        'demo-order',
        'Stock reservation',
        'Concurrency test · 100 virtual users',
      ),
    ],
    runs: [
      ...runs(
        'demo-auth',
        'auth',
        ['auth-token', 'auth-login', 'auth-refresh'],
        ['Completed', 'Failed', 'Cancelled', 'Completed', 'Running'],
      ),
      ...runs(
        'demo-order',
        'order',
        ['order-checkout', 'order-stock'],
        ['Completed', 'Failed', 'Cancelled', 'Completed'],
      ),
    ],
  }
}

export const emptyDataset = (): Dataset => ({
  projects: [],
  environments: [],
  scenarios: [],
  runs: [],
})
