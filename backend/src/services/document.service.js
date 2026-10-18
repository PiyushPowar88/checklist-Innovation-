import { extractPdf } from './pdf.service.js';
import { extractDocx } from './docx.service.js';
import { cleanText, buildMarkedText } from './text-cleaner.service.js';
import * as documentRepo from '../repositories/document.repository.js';
import { detectFileType, safeUnlink, MIME } from '../utils/file.utils.js';

const MIN_TEXT_CHARS = 50;

export async function processUploadedFile(file) {
  // Multer decodes filenames as latin1; restore UTF-8 names.
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

  const type = await detectFileType(file.path);
  if (!type) {
    await safeUnlink(file.path);
    return { rejected: true, filename: originalName, error: 'File content is not a valid PDF or DOCX.' };
  }

  const id = await documentRepo.create({
    originalName,
    storedName: file.filename,
    mimeType: MIME[type],
    fileSize: file.size,
  });
  await documentRepo.markProcessing(id);

  try {
    const { pages, pageCount } = type === 'pdf' ? await extractPdf(file.path) : await extractDocx(file.path);
    const cleaned = pages.map((p) => ({ page: p.page, text: cleanText(p.text) }));
    const charCount = cleaned.reduce((n, p) => n + p.text.length, 0);

    if (charCount < MIN_TEXT_CHARS) {
      const error = 'No extractable text found. This looks like a scanned/image-only file — OCR is required.';
      await documentRepo.markFailed(id, error, pageCount);
      return { id, filename: originalName, status: 'failed', pageCount, charCount, error };
    }

    await documentRepo.markCompleted(id, buildMarkedText(cleaned), pageCount);
    return { id, filename: originalName, status: 'completed', pageCount, charCount, error: null };
  } catch (err) {
    const error = `Extraction failed: ${err.message}`.slice(0, 500);
    await documentRepo.markFailed(id, error, null);
    return { id, filename: originalName, status: 'failed', pageCount: null, charCount: 0, error };
  }
}
