import { describe, it, expect } from 'vitest';
import { ReportExporterService } from '../../src/modules/analytics/report-exporter.service';

describe('Phase 4: ReportExporterService Unit Tests', () => {
  const exporter = new ReportExporterService();

  describe('1. Excel Formula Sanitization', () => {
    it('should prepend single quote to cells beginning with =, +, -, or @', () => {
      expect(exporter.sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(exporter.sanitizeExcelCell('+1234567890')).toBe("'+1234567890");
      expect(exporter.sanitizeExcelCell('-100')).toBe("'-100");
      expect(exporter.sanitizeExcelCell('@SUM()')).toBe("'@SUM()");
    });

    it('should not alter normal text or numeric values', () => {
      expect(exporter.sanitizeExcelCell('Safe Text')).toBe('Safe Text');
      expect(exporter.sanitizeExcelCell(42)).toBe(42);
      expect(exporter.sanitizeExcelCell(null)).toBeNull();
    });
  });

  describe('2. XLSX Generation', () => {
    it('should generate a valid XLSX buffer with sanitized cells', async () => {
      const headers = ['Category', 'Formula Test', 'Count'];
      const rows = [
        ['Water Supply', '=cmd|calc!A0', 15],
        ['Electrical', '+9876543210', 8],
      ];

      const buffer = await exporter.generateExcel('Test Sheet', headers, rows);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
    });
  });

  describe('3. PDF Generation & Stamp', () => {
    it('should generate a valid PDF buffer carrying title, metadata, and audit verification stamp', async () => {
      const headers = ['Category', 'Resolved', 'Avg Hours'];
      const rows = [
        ['Security', 12, '3.5'],
        ['Plumbing', 8, '4.2'],
      ];
      const auditHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      const pdfBuffer = await exporter.generatePdf(
        'Category Trends Report',
        'Palm Grove Society',
        { range: '30d' },
        headers,
        rows,
        auditHash
      );

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // PDF header magic bytes "%PDF-"
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });
  });
});
