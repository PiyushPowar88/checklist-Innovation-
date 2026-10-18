import { processUploadedFile } from '../services/document.service.js';
import * as documentRepo from '../repositories/document.repository.js';
import { AppError } from '../utils/errors.js';

export async function upload(req, res) {
  if (!req.files?.length) throw new AppError(400, 'No files uploaded. Use the "documents" field.');
  const results = [];
  for (const file of req.files) results.push(await processUploadedFile(file));

  const documents = results.filter((r) => !r.rejected);
  const rejected = results.filter((r) => r.rejected);
  if (!documents.length) throw new AppError(400, rejected[0].error, rejected);
  res.status(201).json({ success: true, documents: documents.map((d) => ({ ...d, status: d.status })), rejected });
}

export async function getOne(req, res) {
  const d = await documentRepo.findById(Number(req.params.id));
  if (!d) throw new AppError(404, 'Document not found.');
  res.json({
    success: true,
    document: {
      id: d.id, filename: d.original_name, mimeType: d.mime_type, size: d.file_size, pageCount: d.page_count,
      status: d.extraction_status, error: d.extraction_error, charCount: d.char_count, preview: d.preview,
    },
  });
}
