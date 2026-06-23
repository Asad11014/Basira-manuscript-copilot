import type {
  CreateProjectRequest,
  PaginationQuery,
  Project,
  UpdateProjectRequest,
  Paginated,
} from '@basira/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { paginateArgs, paginateResult } from '../lib/pagination.js';
import { toProjectDto } from '../serializers/project.serializer.js';
import { recordAudit } from './audit.service.js';
import type { AuthUser } from '../auth/context.js';

export async function listProjects(
  user: AuthUser,
  query: PaginationQuery,
): Promise<Paginated<Project>> {
  const rows = await prisma.project.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: 'desc' },
    ...paginateArgs(query),
  });
  return paginateResult(rows, toProjectDto, query);
}

/** Always scoped by org so a user only ever sees their org's data. (§14) */
export async function getProject(
  user: AuthUser,
  id: string,
): Promise<Project> {
  const project = await prisma.project.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!project) throw notFound('Project not found');
  return toProjectDto(project);
}

export async function createProject(
  user: AuthUser,
  input: CreateProjectRequest,
): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      orgId: user.orgId,
      name: input.name,
      description: input.description,
      tags: input.tags ?? [],
    },
  });
  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'project.create',
    targetType: 'project',
    targetId: project.id,
    metadata: { name: project.name },
  });
  return toProjectDto(project);
}

export async function updateProject(
  user: AuthUser,
  id: string,
  input: UpdateProjectRequest,
): Promise<Project> {
  // Confirm ownership before mutating (updateMany would silently no-op otherwise).
  await getProject(user, id);

  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.glossary !== undefined) data.glossary = input.glossary;

  const project = await prisma.project.update({ where: { id }, data });
  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'project.update',
    targetType: 'project',
    targetId: project.id,
  });
  return toProjectDto(project);
}
