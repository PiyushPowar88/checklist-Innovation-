import fs from 'fs/promises';
// Import the inner module: pdf-parse's index.js runs a debug routine when it has no parent module.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

/** Extract text page by page so each page number is reliable. */
export async function extractPdf(filePath) {
  // Copy into a standalone Uint8Array: pdf.js 1.x misreads small pooled Node Buffers ("bad XRef entry").
  const buffer = new Uint8Array(await fs.readFile(filePath));
  const pages = [];

  const pagerender = async (pageData) => {
    const content = await pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
    let lastY;
    let text = '';
    for (const item of content.items) {
      const y = item.transform[5];
      if (lastY === undefined || lastY === y) text += item.str;
      else text += '\n' + item.str;
      lastY = y;
    }
    pages.push(text);
    return text;
  };

  const data = await pdfParse(buffer, { pagerender });
  return { pages: pages.map((text, i) => ({ page: i + 1, text })), pageCount: data.numpages };
}
