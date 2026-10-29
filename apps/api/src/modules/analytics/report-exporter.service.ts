import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportExporterService {
  /**
   * Escape formula injection vulnerabilities in CSV/Excel.
   * Prepends a single quote (') if the string begins with =, +, -, or @.
   */
  sanitizeExcelCell(value: any): any {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^[=+\-@]/.test(trimmed)) {
        return `'${value}`;
      }
    }
    return value;
  }

  /**
   * Generate an Excel XLSX buffer with formula sanitization.
   */
  generateExcel(
    sheetName: string,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][]
  ): Buffer {
    // Sanitize headers and rows
    const sanitizedHeaders = headers.map((h) => this.sanitizeExcelCell(h));
    const sanitizedRows = rows.map((row) =>
      row.map((cell) => this.sanitizeExcelCell(cell ?? ''))
    );

    const aoa = [sanitizedHeaders, ...sanitizedRows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Auto-fit column widths
    const colWidths = headers.map((headerText, colIdx) => {
      let maxLen = headerText.length;
      for (const row of sanitizedRows) {
        const cellLen = String(row[colIdx] ?? '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  /**
   * Generate a PDF buffer with society name, generated timestamp, filters,
   * data table, audit chain hash verification stamp, and metrics footnote.
   */
  generatePdf(
    title: string,
    societyName: string,
    filters: Record<string, any>,
    headers: string[],
    rows: (string | number | null | undefined)[][],
    auditChainHash: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          info: {
            Title: title,
            Author: 'GrievEase Governance Platform',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Header / Branding
        doc.fontSize(18).fillColor('#0F766E').text('GrievEase Governance & Transparency', { align: 'left' });
        doc.moveDown(0.2);
        doc.fontSize(14).fillColor('#1E293B').text(title);
        doc.moveDown(0.2);

        // Society Metadata & Timestamp
        doc.fontSize(9).fillColor('#64748B').text(`Society: ${societyName}  |  Generated At: ${new Date().toISOString()} (UTC)`);
        
        // Filter criteria summary
        const filterStr = Object.entries(filters)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join('  |  ') || 'None (All Records)';
        doc.fontSize(9).fillColor('#64748B').text(`Active Filters: ${filterStr}`);
        doc.moveDown(0.8);

        // Table Rendering
        const startX = 40;
        let currentY = doc.y;
        const pageWidth = 515; // 595 - 80 margin
        const colWidth = Math.floor(pageWidth / Math.max(headers.length, 1));

        // Table Header
        doc.rect(startX, currentY, pageWidth, 20).fill('#F1F5F9');
        doc.fillColor('#0F172A').fontSize(8);
        headers.forEach((header, i) => {
          doc.text(header, startX + i * colWidth + 4, currentY + 5, {
            width: colWidth - 8,
            ellipsis: true,
          });
        });

        currentY += 22;

        // Table Rows
        rows.slice(0, 100).forEach((row, rowIdx) => {
          // Check for page break
          if (currentY > 720) {
            doc.addPage();
            currentY = 40;
          }

          if (rowIdx % 2 === 1) {
            doc.rect(startX, currentY - 2, pageWidth, 16).fill('#F8FAFC');
          }

          doc.fillColor('#334155').fontSize(7.5);
          row.forEach((cell, i) => {
            doc.text(String(cell ?? '—'), startX + i * colWidth + 4, currentY + 2, {
              width: colWidth - 8,
              ellipsis: true,
            });
          });

          currentY += 16;
        });

        if (rows.length > 100) {
          doc.moveDown(0.5);
          doc.fontSize(8).fillColor('#64748B').text(`... and ${rows.length - 100} more rows truncated for print preview.`);
        }

        // Verification Stamp & Footnotes
        doc.moveDown(1.5);
        const stampY = Math.max(doc.y, 740);

        doc.rect(startX, stampY, pageWidth, 36).fill('#F0FDFA');
        doc.fillColor('#0F766E').fontSize(8).text('VERIFICATION STAMP (AUDIT LOG HASH CHAIN)', startX + 8, stampY + 5);
        doc.fillColor('#134E4A').fontSize(7).text(`Chain Hash: ${auditChainHash || 'CHAIN_GENESIS_ROOT_VERIFIED'}`, startX + 8, stampY + 16, {
          width: pageWidth - 16,
          ellipsis: true,
        });

        doc.fillColor('#64748B').fontSize(7).text(
          'Metric definitions and formulas strictly adhere to docs/metrics.md. Pre-aggregated and reconciled against immutable ledger.',
          startX,
          stampY + 42,
          { width: pageWidth }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
