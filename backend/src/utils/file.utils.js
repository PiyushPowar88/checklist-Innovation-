import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const STORAGE_DIR = path.resolve(here, '../../storage');
export const UPLOAD_DIR = path.join(STORAGE_DIR, 'uploads');

export const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Detect the real type from the file's first bytes, not from its extension. */
export async function detectFileType(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(8);
    await handle.read(buf, 0, 8, 0);
    if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
    if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return 'docx';
    return null;
  } finally {
    await handle.close();
  }
}

export async function safeUnlink(p) {
  try {
    await fs.unlink(p);
  } catch {
    /* ignore */
  }
}
