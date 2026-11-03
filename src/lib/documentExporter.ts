/**
 * Document Exporter Utility
 *
 * Generates PDF (via PDFKit with embedded Noto Sans Devanagari font),
 * DOCX (via docx package with Devanagari font formatting),
 * and clean formatted TXT documents.
 */

import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import path from 'path';
import fs from 'fs';
import { DocumentSections } from './templates';

export function getSanitizedFilename(title: string, dateStr: string, ext: 'pdf' | 'docx' | 'txt'): string {
  // Normalize date to YYYY-MM-DD
  let dateFormatted = dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      dateFormatted = d.toISOString().split('T')[0];
    }
  } catch {
    dateFormatted = new Date().toISOString().split('T')[0];
  }

  // Clean title for safe filename
  const cleanTitle = (title || 'Application_Document')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);

  return `${cleanTitle}_${dateFormatted}.${ext}`;
}

export function containsDevanagari(text: string): boolean {
  // Devanagari Unicode range: \u0900-\u097F
  return /[\u0900-\u097F]/.test(text || '');
}

/**
 * Generate PDF buffer with embedded Noto Sans Devanagari font
 */
export async function generatePdf(
  title: string,
  sections: DocumentSections,
  language: 'en' | 'hi' = 'en'
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const isHindi = language === 'hi' || containsDevanagari(sections.body || '') || containsDevanagari(sections.subject || '');
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 54, right: 54 },
        info: {
          Title: title,
          Author: 'TechForm Buddy',
          Subject: sections.subject || title,
        },
      });

      const fontRegPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf');
      const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Bold.ttf');

      const hasLocalDeva = fs.existsSync(fontRegPath);

      let fontRegular = 'Helvetica';
      let fontBold = 'Helvetica-Bold';

      if (isHindi && hasLocalDeva) {
        doc.registerFont('DevaRegular', fontRegPath);
        fontRegular = 'DevaRegular';

        if (fs.existsSync(fontBoldPath)) {
          doc.registerFont('DevaBold', fontBoldPath);
          fontBold = 'DevaBold';
        } else {
          fontBold = 'DevaRegular';
        }
      }

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Header rule
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(54, 45).lineTo(541, 45).stroke();

      // Recipient Header block
      doc.font(fontRegular).fontSize(11).fillColor('#0f172a');
      const headerLines = (sections.header || '').split('\n').filter(Boolean);
      for (const line of headerLines) {
        doc.text(line.trim(), { lineGap: 3 });
      }

      doc.moveDown(0.8);

      // Date right-aligned or standard
      if (sections.date) {
        doc.font(fontRegular).fontSize(10).fillColor('#475569');
        doc.text(sections.date.trim(), { align: 'right' });
      }

      doc.moveDown(0.8);

      // Subject line (prominent, bold, with underline)
      if (sections.subject) {
        doc.font(fontBold).fontSize(11).fillColor('#0f172a');
        doc.text(sections.subject.trim(), {
          align: 'left',
          lineGap: 4,
        });
      }

      doc.moveDown(0.8);

      // Salutation
      if (sections.salutation) {
        doc.font(fontRegular).fontSize(11).fillColor('#0f172a');
        doc.text(sections.salutation.trim());
      }

      doc.moveDown(0.6);

      // Body paragraphs
      if (sections.body) {
        doc.font(fontRegular).fontSize(10.5).fillColor('#1e293b');
        const paragraphs = sections.body.split(/\n\s*\n/).filter(Boolean);
        for (const p of paragraphs) {
          doc.text(p.trim(), {
            align: 'justify',
            lineGap: 4,
          });
          doc.moveDown(0.6);
        }
      }

      // Enclosures list (if applicable)
      if (sections.enclosures && sections.enclosures.length > 0) {
        doc.moveDown(0.5);
        doc.font(fontBold).fontSize(10.5).fillColor('#0f172a');
        doc.text(isHindi ? 'संलग्नक (दस्तावेज़ सूची):' : 'Enclosures (Attached Documents):');
        doc.font(fontRegular).fontSize(10).fillColor('#334155');

        sections.enclosures.forEach((item, idx) => {
          doc.text(`  ${idx + 1}. ${item}`, { indent: 10, lineGap: 2 });
        });
      }

      doc.moveDown(1.2);

      // Closing
      if (sections.closing) {
        doc.font(fontRegular).fontSize(11).fillColor('#0f172a');
        doc.text(sections.closing.trim(), { align: 'left' });
      }

      doc.moveDown(1.5);

      // Signature block
      if (sections.signature) {
        doc.font(fontBold).fontSize(10.5).fillColor('#0f172a');
        const sigLines = sections.signature.split('\n').filter(Boolean);
        for (const line of sigLines) {
          doc.text(line.trim(), { lineGap: 2 });
        }
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text(
        'Generated via TechForm Buddy — Official Citizen Form Assistant',
        54,
        790,
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate DOCX buffer with Noto Sans Devanagari font
 */
export async function generateDocx(
  title: string,
  sections: DocumentSections,
  language: 'en' | 'hi' = 'en'
): Promise<Buffer> {
  const isHindi = language === 'hi' || containsDevanagari(sections.body || '');
  const fontName = isHindi ? 'Noto Sans Devanagari' : 'Calibri';

  const paragraphs: Paragraph[] = [];

  // Header lines
  if (sections.header) {
    const lines = sections.header.split('\n').filter(Boolean);
    for (const l of lines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: l.trim(),
              font: fontName,
              size: 22, // 11pt
              bold: l.toLowerCase().startsWith('to') || l.startsWith('सेवा'),
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Date
  if (sections.date) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: sections.date.trim(),
            font: fontName,
            size: 20, // 10pt
            italics: true,
          }),
        ],
        spacing: { before: 80, after: 120 },
      })
    );
  }

  // Subject line (bold)
  if (sections.subject) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sections.subject.trim(),
            font: fontName,
            size: 22, // 11pt
            bold: true,
            underline: {},
          }),
        ],
        spacing: { before: 120, after: 140 },
      })
    );
  }

  // Salutation
  if (sections.salutation) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sections.salutation.trim(),
            font: fontName,
            size: 22,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Body paragraphs
  if (sections.body) {
    const bodyParagraphs = sections.body.split(/\n\s*\n/).filter(Boolean);
    for (const p of bodyParagraphs) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: p.trim(),
              font: fontName,
              size: 21, // 10.5pt
            }),
          ],
          spacing: { after: 140, line: 276 },
        })
      );
    }
  }

  // Enclosures
  if (sections.enclosures && sections.enclosures.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isHindi ? 'संलग्नक:' : 'Enclosures:',
            font: fontName,
            size: 21,
            bold: true,
          }),
        ],
        spacing: { before: 140, after: 60 },
      })
    );

    sections.enclosures.forEach((enc, idx) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `  ${idx + 1}. ${enc}`,
              font: fontName,
              size: 20,
            }),
          ],
          spacing: { after: 40 },
        })
      );
    });
  }

  // Closing
  if (sections.closing) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sections.closing.trim(),
            font: fontName,
            size: 22,
          }),
        ],
        spacing: { before: 200, after: 200 },
      })
    );
  }

  // Signature
  if (sections.signature) {
    const sigLines = sections.signature.split('\n').filter(Boolean);
    for (const sl of sigLines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sl.trim(),
              font: fontName,
              size: 21,
              bold: true,
            }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  const doc = new Document({
    title,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate formatted plain text
 */
export function generateTxt(
  title: string,
  sections: DocumentSections,
  language: 'en' | 'hi' = 'en'
): string {
  const parts: string[] = [];

  parts.push(title.toUpperCase());
  parts.push('='.repeat(title.length));
  parts.push('');

  if (sections.header) parts.push(sections.header.trim());
  if (sections.date) parts.push(`\n${sections.date.trim()}`);
  if (sections.subject) parts.push(`\n${sections.subject.trim()}`);
  if (sections.salutation) parts.push(`\n${sections.salutation.trim()}`);
  if (sections.body) parts.push(`\n${sections.body.trim()}`);

  if (sections.enclosures && sections.enclosures.length > 0) {
    const encTitle = language === 'hi' ? 'संलग्नक:' : 'Enclosures:';
    const encList = sections.enclosures.map((e, idx) => `  ${idx + 1}. ${e}`).join('\n');
    parts.push(`\n${encTitle}\n${encList}`);
  }

  if (sections.closing) parts.push(`\n${sections.closing.trim()}`);
  if (sections.signature) parts.push(`\n${sections.signature.trim()}`);

  parts.push('\n' + '-'.repeat(50));
  parts.push('Generated via TechForm Buddy');

  return parts.join('\n');
}
