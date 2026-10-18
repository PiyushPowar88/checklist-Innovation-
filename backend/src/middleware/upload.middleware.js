import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { UPLOAD_DIR } from '../utils/file.utils.js';
import { AppError } from '../utils/errors.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  // Safe server-side name: never reuse the client's filename on disk.
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.pdf', '.docx'].includes(ext)) {
    return cb(new AppError(400, `Unsupported file type: ${file.originalname}. Only PDF and DOCX are allowed.`));
  }
  cb(null, true);
};

// Field name must match the frontend: formData.append("documents", file)
export const uploadDocuments = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: env.maxFiles },
}).array('documents', env.maxFiles);
