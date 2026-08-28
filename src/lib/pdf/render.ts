import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { DISCLAIMER_FOOTER, type Block, type PackDocument } from './document.ts';

/**
 * Rendering. Contains no decisions — every choice about what a pack says was
 * made in document.ts. This file only turns that structure into bytes.
 *
 * Deliberately plain: standard fonts, no images, no embedded assets. A pack
 * gets printed on a home printer, carried to a bank counter in a folder, and
 * photocopied. Legibility after a bad photocopy matters more than looking
 * designed.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 56;
const CONTENT_WIDTH = A4.width - MARGIN * 2;

const INK = rgb(0.11, 0.1, 0.09);
const SOFT = rgb(0.45, 0.43, 0.4);
const RULE = rgb(0.85, 0.83, 0.79);

interface Ctx {
  pdf: PDFDocument;
  body: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
  pageNumber: number;
  caseRef: string;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.pdf.addPage([A4.width, A4.height]);
  ctx.y = A4.height - MARGIN;
  ctx.pageNumber += 1;
  drawFooter(ctx);
}

function drawFooter(ctx: Ctx): void {
  const size = 7;
  ctx.page.drawLine({
    start: { x: MARGIN, y: MARGIN - 14 },
    end: { x: A4.width - MARGIN, y: MARGIN - 14 },
    thickness: 0.5, color: RULE,
  });
  ctx.page.drawText(DISCLAIMER_FOOTER, {
    x: MARGIN, y: MARGIN - 26, size, font: ctx.body, color: SOFT,
    maxWidth: CONTENT_WIDTH - 60,
  });
  ctx.page.drawText(`${ctx.caseRef} · p${ctx.pageNumber}`, {
    x: A4.width - MARGIN - 56, y: MARGIN - 26, size, font: ctx.body, color: SOFT,
  });
}

/** Reserve space, starting a new page when the block will not fit. */
function ensure(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < MARGIN + 8) newPage(ctx);
}

/** Greedy word wrap against real glyph widths. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // A single word longer than the line (a long account reference) is
        // hard-split rather than allowed to overflow the margin.
        if (font.widthOfTextAtSize(word, size) > width) {
          let chunk = '';
          for (const ch of word) {
            if (font.widthOfTextAtSize(chunk + ch, size) > width) { lines.push(chunk); chunk = ch; }
            else chunk += ch;
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    lines.push(line);
  }

  return lines;
}

function drawParagraph(
  ctx: Ctx, text: string,
  opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number } = {},
): void {
  const size = opts.size ?? 10;
  const font = opts.font ?? ctx.body;
  const indent = opts.indent ?? 0;
  const leading = size * 1.45;

  for (const line of wrap(text, font, size, CONTENT_WIDTH - indent)) {
    ensure(ctx, leading);
    ctx.page.drawText(line, {
      x: MARGIN + indent, y: ctx.y - size, size, font, color: opts.color ?? INK,
    });
    ctx.y -= leading;
  }
}

function drawBlock(ctx: Ctx, block: Block): void {
  switch (block.kind) {
    case 'heading':
      ctx.y -= 8;
      drawParagraph(ctx, block.text, { size: 12, font: ctx.bold });
      ctx.y -= 2;
      break;

    case 'label':
      ctx.y -= 6;
      drawParagraph(ctx, block.text.toUpperCase(), { size: 8, font: ctx.bold, color: SOFT });
      break;

    case 'para':
      drawParagraph(ctx, block.text);
      ctx.y -= 6;
      break;

    case 'rule':
      ensure(ctx, 16);
      ctx.y -= 8;
      ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y }, end: { x: A4.width - MARGIN, y: ctx.y },
        thickness: 0.5, color: RULE,
      });
      ctx.y -= 12;
      break;

    case 'list':
      for (const [i, item] of block.items.entries()) {
        const marker = block.ordered ? `${i + 1}.` : '•';
        ensure(ctx, 14);
        ctx.page.drawText(marker, { x: MARGIN, y: ctx.y - 10, size: 10, font: ctx.body, color: SOFT });
        drawParagraph(ctx, item, { indent: 18 });
        ctx.y -= 3;
      }
      ctx.y -= 6;
      break;

    case 'table': {
      const cols = block.head.length;
      const colWidth = CONTENT_WIDTH / cols;

      ensure(ctx, 22);
      block.head.forEach((h, i) => {
        ctx.page.drawText(h.toUpperCase(), {
          x: MARGIN + i * colWidth, y: ctx.y - 8, size: 7.5, font: ctx.bold, color: SOFT,
        });
      });
      ctx.y -= 14;
      ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y }, end: { x: A4.width - MARGIN, y: ctx.y },
        thickness: 0.5, color: RULE,
      });
      ctx.y -= 8;

      for (const row of block.rows) {
        const cellLines = row.map((c) => wrap(c, ctx.body, 9, colWidth - 8));
        const rowHeight = Math.max(...cellLines.map((l) => l.length)) * 13 + 6;
        ensure(ctx, rowHeight);

        const top = ctx.y;
        cellLines.forEach((lines, i) => {
          lines.forEach((line, j) => {
            ctx.page.drawText(line, {
              x: MARGIN + i * colWidth, y: top - 9 - j * 13, size: 9, font: ctx.body, color: INK,
            });
          });
        });
        ctx.y = top - rowHeight;
      }
      ctx.y -= 8;
      break;
    }

    case 'signature':
      ctx.y -= 16;
      for (const label of block.lines) {
        ensure(ctx, 40);
        ctx.page.drawLine({
          start: { x: MARGIN, y: ctx.y - 20 }, end: { x: MARGIN + 220, y: ctx.y - 20 },
          thickness: 0.75, color: INK,
        });
        ctx.page.drawText(label, {
          x: MARGIN, y: ctx.y - 32, size: 8, font: ctx.body, color: SOFT,
        });
        ctx.y -= 46;
      }
      break;
  }
}

export async function renderPack(doc: PackDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  // No author, no producer, no creator: PDF metadata is a well-known leak
  // path, and a pack may be forwarded to a bank, a lawyer and three relatives.
  pdf.setTitle(`Mera Hissa pack ${doc.caseRef}`);
  pdf.setSubject('Estate transmission documents');
  pdf.setProducer('');
  pdf.setCreator('');

  const ctx: Ctx = {
    pdf,
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    page: null as unknown as PDFPage,
    y: 0,
    pageNumber: 0,
    caseRef: doc.caseRef,
  };

  for (const page of doc.pages) {
    newPage(ctx);

    drawParagraph(ctx, page.title, { size: 16, font: ctx.bold });
    if (page.subtitle) {
      ctx.y -= 2;
      drawParagraph(ctx, page.subtitle, { size: 8, color: SOFT });
    }
    ctx.y -= 10;

    for (const block of page.blocks) drawBlock(ctx, block);
  }

  return pdf.save();
}
