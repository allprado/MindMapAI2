/**
 * PDF parsing utilities
 */

interface PDFData {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
}

export async function parsePDF(buffer: Buffer): Promise<PDFData> {
  try {
    // Dynamic import to avoid build-time issues
    const pdfParse = await import('pdf-parse');
    return await pdfParse.default(buffer);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF content');
  }
}
