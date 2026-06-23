import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import type {
  ExportData,
  ExportManuscript,
  ExportPage,
} from '../exporters/types.js';

/** Assemble the current content of one manuscript for export. */
async function assembleManuscript(manuscriptId: string): Promise<ExportManuscript> {
  const manuscript = await prisma.manuscript.findUniqueOrThrow({
    where: { id: manuscriptId },
    include: {
      pages: {
        orderBy: { index: 'asc' },
        include: {
          transcriptions: {
            where: { isCurrent: true },
            include: {
              translations: { where: { isCurrent: true } },
              entities: true,
            },
          },
          annotations: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const pages: ExportPage[] = manuscript.pages.map((page) => {
    const current = page.transcriptions[0];
    const translation = current?.translations[0];
    return {
      index: page.index,
      transcription: current?.text ?? null,
      translation: translation?.text ?? null,
      annotations: page.annotations.map((a) => ({
        kind: a.kind,
        body: a.body,
        author: a.user.name,
      })),
      entities: (current?.entities ?? []).map((e) => ({
        type: e.type,
        surfaceText: e.surfaceText,
        normalizedName: e.normalizedName,
      })),
    };
  });

  return {
    title: manuscript.title,
    sourceLanguage: manuscript.sourceLanguage,
    script: manuscript.script,
    pages,
  };
}

/** Gather export data for a manuscript or a whole project, org-scoped. */
export async function assembleExportData(
  orgId: string,
  input: { manuscriptId?: string; projectId?: string },
): Promise<ExportData> {
  if (input.manuscriptId) {
    const owned = await prisma.manuscript.findFirst({
      where: { id: input.manuscriptId, project: { orgId } },
      select: { id: true, title: true },
    });
    if (!owned) throw notFound('Manuscript not found');
    return {
      title: owned.title,
      generatedAt: new Date().toISOString(),
      manuscripts: [await assembleManuscript(owned.id)],
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, orgId },
    include: { manuscripts: { select: { id: true } } },
  });
  if (!project) throw notFound('Project not found');

  const manuscripts = await Promise.all(
    project.manuscripts.map((m) => assembleManuscript(m.id)),
  );
  return {
    title: project.name,
    generatedAt: new Date().toISOString(),
    manuscripts,
  };
}
