import { registerExporter, type Exporter, type ExportData } from './types.js';

export const txtExporter: Exporter = {
  format: 'txt',
  contentType: 'text/plain; charset=utf-8',
  extension: 'txt',
  async render(data: ExportData) {
    const out: string[] = [
      data.title,
      `Generated ${data.generatedAt}`,
      'Machine-assisted drafts — reviewed by the scholar (the final authority).',
      '',
    ];
    for (const m of data.manuscripts) {
      out.push(`==== ${m.title} (${m.sourceLanguage} / ${m.script}) ====`, '');
      for (const p of m.pages) {
        out.push(`--- Page ${p.index + 1} ---`);
        if (p.transcription) out.push('Transcription:', p.transcription);
        if (p.translation) out.push('', 'Translation:', p.translation);
        if (p.annotations.length) {
          out.push('', 'Annotations:');
          for (const a of p.annotations)
            out.push(`  [${a.kind}] ${a.body} — ${a.author}`);
        }
        out.push('');
      }
    }
    return Buffer.from(out.join('\n'), 'utf-8');
  },
};

registerExporter(txtExporter);
