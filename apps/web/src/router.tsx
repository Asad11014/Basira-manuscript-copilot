import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth.js';
import { AppLayout } from './components/AppLayout.js';
import { LoginRoute } from './routes/Login.js';
import { ProjectsRoute } from './routes/Projects.js';
import { ProjectDetailRoute } from './routes/ProjectDetail.js';
import { ManuscriptWorkspaceRoute } from './routes/ManuscriptWorkspace.js';
import { PageWorkspaceRoute } from './routes/PageWorkspace.js';
import { SearchRoute } from './routes/Search.js';
import { AdminRoute } from './routes/Admin.js';

/**
 * Route table. One file per page under routes/ (§6). Workspace routes
 * (manuscript/:id, page/:id, admin, search) are added in M2+.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginRoute /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <Navigate to="/projects" replace /> },
      { path: '/projects', element: <ProjectsRoute /> },
      { path: '/project/:id', element: <ProjectDetailRoute /> },
      { path: '/manuscript/:id', element: <ManuscriptWorkspaceRoute /> },
      { path: '/page/:id', element: <PageWorkspaceRoute /> },
      { path: '/search', element: <SearchRoute /> },
      { path: '/admin', element: <AdminRoute /> },
    ],
  },
]);
