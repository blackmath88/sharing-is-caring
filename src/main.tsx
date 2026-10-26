import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  RouterProvider, createHashHistory, createRootRoute, createRoute, createRouter,
} from '@tanstack/react-router'
import { Layout } from './Layout'
import { ImportPage } from './pages/Import'
import { TagPage } from './pages/Tag'
import { TemplatesPage } from './pages/Templates'
import { ExportPage } from './pages/Export'
import './styles.css'

const root = createRootRoute({ component: Layout })
const page = <P extends string>(path: P, component: () => React.ReactNode) =>
  createRoute({ getParentRoute: () => root, path, component })

const router = createRouter({
  routeTree: root.addChildren([
    page('/', ImportPage),
    page('/taggen', TagPage),
    page('/vorlagen', TemplatesPage),
    page('/export', ExportPage),
  ]),
  history: createHashHistory(),
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>,
)
