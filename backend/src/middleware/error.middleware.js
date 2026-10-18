import { env } from '../config/env.js';

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? `A file exceeds the ${env.maxFileSizeMb} MB limit.`
      : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `You can upload at most ${env.maxFiles} files at once.`
      : err.message;
  }
  if (err.type === 'entity.too.large') { status = 413; message = 'Request body too large.'; }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body.'; }

  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    error: status >= 500 && env.nodeEnv === 'production' ? 'Internal server error' : message,
    ...(err.details ? { details: err.details } : {}),
  });
}
