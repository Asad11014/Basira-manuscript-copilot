import type { Prisma } from '@prisma/client';
import type { SearchHit, SearchQuery, SearchResults } from '@basira/shared';
import { prisma } from '../lib/db.js';
import type { AuthUser } from '../auth/context.js';

const PER_SCOPE_LIMIT = 25;

function snippet(text: string, q: string): string {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 40);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

/** Full-text-ish search across content, org-scoped. (FR-16) */
export async function search(
  user: AuthUser,
  query: SearchQuery,
): Promise<SearchResults> {
  const { q, projectId, scope } = query;
  const scopes = scope
    ? [scope]
    : (['transcription', 'translation', 'annotation'] as const);

  const projectFilter: Prisma.ProjectWhereInput = {
    orgId: user.orgId,
    ...(projectId ? { id: projectId } : {}),
  };
  const pageInOrg: Prisma.PageWhereInput = {
    manuscript: { project: projectFilter },
  };
  const contains: Prisma.StringFilter = { contains: q, mode: 'insensitive' };

  const hits: SearchHit[] = [];

  if (scopes.includes('transcription')) {
    const rows = await prisma.transcription.findMany({
      where: { isCurrent: true, text: contains, page: pageInOrg },
      include: { page: { include: { manuscript: true } } },
      take: PER_SCOPE_LIMIT,
    });
    for (const r of rows) {
      hits.push({
        scope: 'transcription',
        pageId: r.pageId,
        pageIndex: r.page.index,
        manuscriptId: r.page.manuscriptId,
        manuscriptTitle: r.page.manuscript.title,
        snippet: snippet(r.text, q),
      });
    }
  }

  if (scopes.includes('translation')) {
    const rows = await prisma.translation.findMany({
      where: { isCurrent: true, text: contains, transcription: { page: pageInOrg } },
      include: {
        transcription: { include: { page: { include: { manuscript: true } } } },
      },
      take: PER_SCOPE_LIMIT,
    });
    for (const r of rows) {
      const page = r.transcription.page;
      hits.push({
        scope: 'translation',
        pageId: page.id,
        pageIndex: page.index,
        manuscriptId: page.manuscriptId,
        manuscriptTitle: page.manuscript.title,
        snippet: snippet(r.text, q),
      });
    }
  }

  if (scopes.includes('annotation')) {
    const rows = await prisma.annotation.findMany({
      where: {
        body: contains,
        OR: [{ page: pageInOrg }, { transcription: { page: pageInOrg } }],
      },
      include: {
        page: { include: { manuscript: true } },
        transcription: { include: { page: { include: { manuscript: true } } } },
      },
      take: PER_SCOPE_LIMIT,
    });
    for (const r of rows) {
      const page = r.page ?? r.transcription?.page;
      if (!page) continue;
      hits.push({
        scope: 'annotation',
        pageId: page.id,
        pageIndex: page.index,
        manuscriptId: page.manuscriptId,
        manuscriptTitle: page.manuscript.title,
        snippet: snippet(r.body, q),
      });
    }
  }

  return { query: q, hits };
}
