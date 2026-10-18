import { Router } from 'express';
import { uploadDocuments } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../schemas/checklist.schema.js';
import * as c from '../controllers/document.controller.js';

const r = Router();
r.post('/upload', uploadDocuments, asyncHandler(c.upload));
r.get('/:id', validate(idParamSchema, 'params'), asyncHandler(c.getOne));
export default r;
