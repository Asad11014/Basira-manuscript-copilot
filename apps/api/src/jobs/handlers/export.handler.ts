import type { ExportFormat } from '@basira/shared';
import { prisma } from '../../lib/db.js';
import { getStorage } from '../../storage/index.js';
import { storageKeys } from '../../lib/keys.js';
import { assembleExportData } from '../../services/export-data.service.js';
import { resolveExporter } from '../../exporters/types.js';
import { recordAudit } from '../../services/audit.service.js';
import { registerJobHandler } from '../registry.js';
import type { JobHandler } from '../types.js';
// Register exporters before resolving them.
import '../../exporters/index.js';

/**
 * Render an export (DOCX/PDF/TXT/JSON/CSV), store it, and create an
 * ExportArtifact row. The job's resultRef is the artifact id to download. (§9)
 */
export const exportHandler: JobHandler = {
  type: 'export',
  async run(ctx) {
    const format = ctx.data.format as ExportFormat;
    const manuscriptId =
      typeof ctx.data.manuscriptId === 'string' ? ctx.data.manuscriptId : undefined;
    const projectId =
      typeof ctx.data.projectId === 'string' ? ctx.data.projectId : undefined;
    const requestedByUserId = ctx.data.requestedByUserId as string;

    await ctx.setProgress(20);
    const data = await assembleExportData(ctx.orgId, { manuscriptId, projectId });

    await ctx.setProgress(50);
    const exporter = resolveExporter(format);
    const buffer = await exporter.render(data);

    await ctx.setProgress(80);
    const artifact = await prisma.exportArtifact.create({
      data: {
        manuscriptId,
        projectId,
        format,
        fileKey: '',
        requestedByUserId,
        orgId: ctx.orgId,
      },
    });
    const key = storageKeys.export(artifact.id, exporter.extension);
    await getStorage().put(key, buffer, exporter.contentType);
    await prisma.exportArtifact.update({
      where: { id: artifact.id },
      data: { fileKey: key },
    });

    await recordAudit({
      orgId: ctx.orgId,
      userId: requestedByUserId,
      action: 'export.create',
      targetType: 'export',
      targetId: artifact.id,
      metadata: { format, manuscriptId, projectId },
    });

    await ctx.setProgress(100);
    return { resultRef: artifact.id };
  },
};

registerJobHandler(exportHandler);
