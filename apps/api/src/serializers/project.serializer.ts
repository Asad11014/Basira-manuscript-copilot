import type { Project as PrismaProject } from '@prisma/client';
import type { Project } from '@basira/shared';

type GlossaryEntry = { term: string; gloss: string };

/** Parse the loosely-typed Json glossary column into the shared shape. */
function parseGlossary(value: PrismaProject['glossary']): GlossaryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((e) =>
    e &&
    typeof e === 'object' &&
    'term' in e &&
    'gloss' in e &&
    typeof e.term === 'string' &&
    typeof e.gloss === 'string'
      ? [{ term: e.term, gloss: e.gloss }]
      : [],
  );
}

export function toProjectDto(project: PrismaProject): Project {
  return {
    id: project.id,
    orgId: project.orgId,
    name: project.name,
    description: project.description,
    tags: project.tags,
    glossary: parseGlossary(project.glossary),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
