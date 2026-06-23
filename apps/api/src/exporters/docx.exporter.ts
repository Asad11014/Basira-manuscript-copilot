import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { registerExporter, type Exporter, type ExportData } from './types.js';

/** DOCX is the highest-fidelity Arabic format — Word shapes RTL text itself. */
export const docxExporter: Exporter = {
  format: 'docx',
  contentType:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  extension: 'docx',
  async render(data: ExportData) {
    const children: Paragraph[] = [
      new Paragraph({ heading: HeadingLevel.TITLE, text: data.title }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated ${data.generatedAt} — machine-assisted drafts reviewed by the scholar.`,
            italics: true,
            color: '666666',
          }),
        ],
      }),
    ];

    for (const m of data.manuscripts) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          text: `${m.title} (${m.sourceLanguage} / ${m.script})`,
        }),
      );
      for (const p of m.pages) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: `Page ${p.index + 1}`,
          }),
        );
        if (p.transcription) {
          children.push(new Paragraph({ text: 'Transcription', heading: HeadingLevel.HEADING_3 }));
          for (const line of p.transcription.split('\n')) {
            children.push(
              new Paragraph({
                bidirectional: true,
                children: [new TextRun({ text: line, rightToLeft: true })],
              }),
            );
          }
        }
        if (p.translation) {
          children.push(new Paragraph({ text: 'Translation', heading: HeadingLevel.HEADING_3 }));
          for (const line of p.translation.split('\n')) {
            children.push(new Paragraph({ text: line }));
          }
        }
        if (p.annotations.length) {
          children.push(new Paragraph({ text: 'Annotations', heading: HeadingLevel.HEADING_3 }));
          for (const a of p.annotations) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `[${a.kind}] `, bold: true }),
                  new TextRun(`${a.body} — ${a.author}`),
                ],
              }),
            );
          }
        }
      }
    }

    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  },
};

registerExporter(docxExporter);
