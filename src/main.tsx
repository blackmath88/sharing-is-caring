import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Outlet, RouterProvider, createHashHistory, createRootRoute, createRoute, createRouter,
} from '@tanstack/react-router'
import { Layout } from './Layout'
import { ImportPage } from './pages/Import'
import { TagPage } from './pages/Tag'
import { TemplatesPage } from './pages/Templates'
import { ExportPage } from './pages/Export'
import { PostPage } from './pages/Post'
import './styles.css'

const root = createRootRoute({ component: Outlet })
const app = createRoute({ getParentRoute: () => root, id: 'app', component: Layout })
const page = <P extends string>(path: P, component: () => React.ReactNode) =>
  createRoute({ getParentRoute: () => app, path, component })
// Kopierseite ohne App-Rahmen, Ziel von „Text kopieren“ in der Mail
const post = createRoute({
  getParentRoute: () => root, path: '/post', component: PostPage,
  validateSearch: (s: Record<string, unknown>) => ({ t: typeof s.t === 'string' ? s.t : '' }),
})

const router = createRouter({
  routeTree: root.addChildren([
    app.addChildren([
      page('/', ImportPage),
      page('/taggen', TagPage),
      page('/vorlagen', TemplatesPage),
      page('/export', ExportPage),
    ]),
    post,
  ]),
  history: createHashHistory(),
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>,
)
