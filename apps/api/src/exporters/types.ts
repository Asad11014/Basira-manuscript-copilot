import type { ExportFormat } from '@basira/shared';

export interface ExportPage {
  index: number;
  transcription: string | null;
  translation: string | null;
  annotations: Array<{ kind: string; body: string; author: string }>;
  entities: Array<{ type: string; surfaceText: string; normalizedName: string | null }>;
}

export interface ExportManuscript {
  title: string;
  sourceLanguage: string;
  script: string;
  pages: ExportPage[];
}

export interface ExportData {
  title: string;
  generatedAt: string;
  manuscripts: ExportManuscript[];
}

/**
 * Pluggable export format (§5). Adding a format = one new file + one registry
 * line. TEI-XML is the documented future seam (§3, §20).
 */
export interface Exporter {
  format: ExportFormat;
  contentType: string;
  extension: string;
  render(data: ExportData): Promise<Buffer>;
}

const exporters = new Map<ExportFormat, Exporter>();

export function registerExporter(exporter: Exporter): void {
  exporters.set(exporter.format, exporter);
}

export function resolveExporter(format: ExportFormat): Exporter {
  const exporter = exporters.get(format);
  if (!exporter) throw new Error(`No exporter registered for format: ${format}`);
  return exporter;
}
