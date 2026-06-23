import { registerExporter, type Exporter, type ExportData } from './types.js';

export const jsonExporter: Exporter = {
  format: 'json',
  contentType: 'application/json',
  extension: 'json',
  async render(data: ExportData) {
    return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  },
};

registerExporter(jsonExporter);
