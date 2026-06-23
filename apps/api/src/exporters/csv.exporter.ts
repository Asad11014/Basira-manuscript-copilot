import { stringify } from 'csv-stringify/sync';
import { registerExporter, type Exporter, type ExportData } from './types.js';

export const csvExporter: Exporter = {
  format: 'csv',
  contentType: 'text/csv; charset=utf-8',
  extension: 'csv',
  async render(data: ExportData) {
    const records: Array<Record<string, string | number>> = [];
    for (const m of data.manuscripts) {
      for (const p of m.pages) {
        records.push({
          manuscript: m.title,
          page: p.index + 1,
          transcription: p.transcription ?? '',
          translation: p.translation ?? '',
          annotations: p.annotations
            .map((a) => `[${a.kind}] ${a.body}`)
            .join(' | '),
        });
      }
    }
    const csv = stringify(records, {
      header: true,
      columns: ['manuscript', 'page', 'transcription', 'translation', 'annotations'],
      bom: true, // help spreadsheet apps detect UTF-8 (Arabic)
    });
    return Buffer.from(csv, 'utf-8');
  },
};

registerExporter(csvExporter);
