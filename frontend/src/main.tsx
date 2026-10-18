import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'
import { createProjectsApi } from './features/projects/data/api'
import { demoDataset } from './mocks/fixtures'
import './styles.css'

// Persist explicit demo selection in the URL across router navigation/reload.
const params = new URLSearchParams(window.location.search)
const demo = params.get('demo') === '1'
const numberParam = (key: string, fallback: number, max: number) => {
  const raw = params.get(key)
  if (raw === null || !/^\d+$/.test(raw)) return fallback
  return Math.min(Number(raw), max)
}
const api = createProjectsApi({
  seed: demo ? demoDataset() : undefined,
  delayMs: import.meta.env.DEV ? numberParam('delay', 250, 5000) : 250,
  failLoadCount: import.meta.env.DEV ? numberParam('failLoad', 0, 10) : 0,
  failCreateCount: import.meta.env.DEV ? numberParam('failCreate', 0, 10) : 0,
})
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App api={api} demo={demo} />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
