import PDFDocument from 'pdfkit';
import { renderArabicBlock } from './arabic-image.js';
import { registerExporter, type Exporter, type ExportData } from './types.js';

export const pdfExporter: Exporter = {
  format: 'pdf',
  contentType: 'application/pdf',
  extension: 'pdf',
  render(data: ExportData) {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const contentWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc.fontSize(20).text(data.title);
      doc
        .moveDown(0.2)
        .fontSize(9)
        .fillColor('#666666')
        .text(
          `Generated ${data.generatedAt} — machine-assisted drafts, reviewed by the scholar.`,
        )
        .fillColor('#000000')
        .moveDown();

      data.manuscripts.forEach((m, mi) => {
        if (mi > 0) doc.addPage();
        doc
          .fontSize(15)
          .text(`${m.title} (${m.sourceLanguage} / ${m.script})`)
          .moveDown(0.5);

        for (const p of m.pages) {
          doc
            .fontSize(12)
            .fillColor('#333333')
            .text(`Page ${p.index + 1}`)
            .fillColor('#000000')
            .moveDown(0.2);

          if (p.transcription) {
            // Arabic is rasterised (shaped) and embedded as an image.
            const img = renderArabicBlock(p.transcription.split('\n'));
            doc.image(img, { fit: [contentWidth, 600] }).moveDown(0.3);
          }
          if (p.translation) {
            doc.fontSize(9).fillColor('#333333').text('Translation:');
            doc.fontSize(11).fillColor('#000000').text(p.translation).moveDown(0.3);
          }
          if (p.annotations.length) {
            doc.fontSize(9).fillColor('#333333').text('Annotations:').fillColor('#000000');
            for (const a of p.annotations) {
              doc.fontSize(10).text(`• [${a.kind}] ${a.body} — ${a.author}`);
            }
          }
          doc.moveDown(0.6);
        }
      });

      doc.end();
    });
  },
};

registerExporter(pdfExporter);
