import { Router } from 'express';
import {
  createProjectRequestSchema,
  paginationQuerySchema,
  updateProjectRequestSchema,
  type Manuscript,
  type Paginated,
  type Project,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody, parseQuery } from '../http/validate.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from '../services/project.service.js';
import { listManuscripts } from '../services/manuscript.service.js';

// Mounted at /projects (see routes/index.ts), so router-level auth only applies
// to this resource — it does not leak to unmatched routes.
export const projectRoutes: Router = Router();

projectRoutes.use(requireAuth);

projectRoutes.get(
  '/',
  asyncHandler<Paginated<Project>>(async (req, res) => {
    const query = parseQuery(paginationQuerySchema, req);
    res.json(await listProjects(getAuthUser(req), query));
  }),
);

projectRoutes.post(
  '/',
  requireRole('admin', 'editor'),
  asyncHandler<Project>(async (req, res) => {
    const input = parseBody(createProjectRequestSchema, req);
    res.status(201).json(await createProject(getAuthUser(req), input));
  }),
);

projectRoutes.get(
  '/:id',
  asyncHandler<Project>(async (req, res) => {
    res.json(await getProject(getAuthUser(req), param(req, 'id')));
  }),
);

projectRoutes.get(
  '/:id/manuscripts',
  asyncHandler<Manuscript[]>(async (req, res) => {
    res.json(await listManuscripts(getAuthUser(req), param(req, 'id')));
  }),
);

projectRoutes.patch(
  '/:id',
  requireRole('admin', 'editor'),
  asyncHandler<Project>(async (req, res) => {
    const input = parseBody(updateProjectRequestSchema, req);
    res.json(await updateProject(getAuthUser(req), param(req, 'id'), input));
  }),
);
