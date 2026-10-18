import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema, createGenerationSchema, draftSchema } from '../schemas/checklist.schema.js';
import * as c from '../controllers/generation.controller.js';

const r = Router();
const startLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: { success: false, error: 'Too many generation requests. Try again later.' },
});
const id = validate(idParamSchema, 'params');

r.get('/', asyncHandler(c.list));
r.post('/', startLimiter, validate(createGenerationSchema), asyncHandler(c.create));
r.get('/:id', id, asyncHandler(c.getOne));
r.get('/:id/preview', id, asyncHandler(c.getPreview));
r.put('/:id/preview', id, validate(draftSchema), asyncHandler(c.savePreview));
r.post('/:id/approve', id, asyncHandler(c.approve));
export default r;
