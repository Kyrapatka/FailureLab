import type { ProjectsApi } from '../features/projects/model/types'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './Layout'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { OverviewPage } from '../features/project-overview/OverviewPage'
import { NotFound } from '../shared/ui/States'

export function App({ api, demo = false }: { api: ProjectsApi; demo?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (demo && new URLSearchParams(location.search).get('demo') !== '1') {
      const search = new URLSearchParams(location.search)
      search.set('demo', '1')
      void navigate({ pathname: location.pathname, search: search.toString() }, { replace: true })
    }
  }, [demo, location.pathname, location.search, navigate])
  useEffect(() => {
    document.getElementById('main')?.focus()
  }, [location.pathname])
  return (
    <Routes>
      <Route element={<Layout api={api} demo={demo} />}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage api={api} demo={demo} />} />
        <Route path="/projects/:projectId" element={<OverviewPage api={api} />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
