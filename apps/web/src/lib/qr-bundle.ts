import QRCode from 'qrcode';

/**
 * Generate SVG string of QR code using bundled qrcode library.
 * No external CDNs or Google Chart APIs.
 */
export async function generateQrSvg(data: string, options?: { width?: number; margin?: number }): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    width: options?.width || 256,
    margin: options?.margin ?? 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate Data URL (PNG) of QR code.
 */
export async function generateQrDataUrl(data: string, options?: { width?: number; margin?: number }): Promise<string> {
  return QRCode.toDataURL(data, {
    width: options?.width || 280,
    margin: options?.margin ?? 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Native BarcodeDetector interface for bundled camera scanning where supported.
 */
export async function detectBarcodeFromImage(canvas: HTMLCanvasElement): Promise<string | null> {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await barcodeDetector.detect(canvas);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch {}
  }
  return null;
}
