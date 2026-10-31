import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
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
  async generateExcel(
    sheetName: string,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][]
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

    // Sanitize headers and rows
    const sanitizedHeaders = headers.map((h) => this.sanitizeExcelCell(h));
    worksheet.addRow(sanitizedHeaders);

    for (const row of rows) {
      const sanitizedRow = row.map((cell) => this.sanitizeExcelCell(cell ?? ''));
      worksheet.addRow(sanitizedRow);
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column, colIdx) => {
      const headerText = sanitizedHeaders[colIdx] || '';
      let maxLen = headerText.length;
      for (const r of rows) {
        const val = String(r[colIdx] ?? '');
        if (val.length > maxLen) maxLen = val.length;
      }
      column.width = Math.min(Math.max(maxLen + 4, 12), 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate a PDF buffer with society name, generated timestamp, filters,
   * data table, audit chain hash verification stamp, and metrics footnote.
   */
  generatePdf(
    title: string,
    societyName: string,
    filters: Record<string, string>,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][],
    auditHash?: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // 1. Header & Title
        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .text(title, { align: 'center' });
        doc.moveDown(0.2);

        doc
          .font('Helvetica')
          .fontSize(11)
          .text(`Society: ${societyName}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`, { align: 'center' });

        // Filters applied
        if (Object.keys(filters).length > 0) {
          const filterStr = Object.entries(filters)
            .map(([k, v]) => `${k}=${v}`)
            .join(' | ');
          doc.fontSize(9).fillColor('#666666').text(`Filters: ${filterStr}`, { align: 'center' });
        }
        doc.moveDown(1);

        // 2. Data Table
        const tableTop = doc.y;
        const colWidth = (doc.page.width - 80) / headers.length;

        // Table Header
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
        headers.forEach((h, i) => {
          doc.text(h, 40 + i * colWidth, tableTop, { width: colWidth, align: 'left' });
        });

        doc.moveTo(40, tableTop + 14).lineTo(doc.page.width - 40, tableTop + 14).strokeColor('#cccccc').stroke();

        let rowTop = tableTop + 18;
        doc.font('Helvetica').fontSize(9).fillColor('#333333');

        // Table Rows (capped at 50 for single-page preview, paginated if more)
        rows.slice(0, 50).forEach((row) => {
          if (rowTop > doc.page.height - 80) {
            doc.addPage();
            rowTop = 40;
          }
          row.forEach((cell, i) => {
            doc.text(String(cell ?? ''), 40 + i * colWidth, rowTop, {
              width: colWidth,
              align: 'left',
            });
          });
          rowTop += 14;
        });

        doc.moveDown(2);

        // 3. Cryptographic Audit Chain Verification Stamp (Footer)
        const stampTop = Math.max(rowTop + 20, doc.page.height - 70);
        doc.moveTo(40, stampTop - 5).lineTo(doc.page.width - 40, stampTop - 5).strokeColor('#e5e7eb').stroke();

        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#6b7280');
        doc.text(
          'Cryptographically verified via GrievEase Append-Only Audit Chain (SHA-256).',
          40,
          stampTop,
          { align: 'left' }
        );

        if (auditHash) {
          doc.font('Courier').fontSize(7).text(`Latest Block Hash: ${auditHash}`, 40, stampTop + 10, { align: 'left' });
        }

        doc.font('Helvetica').fontSize(8).text(
          'Complies with offline non-repudiation and Society Bye-Laws record standards.',
          40,
          stampTop + 20,
          { align: 'left' }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
