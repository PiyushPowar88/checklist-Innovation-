import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParamSchema, updateChecklistSchema } from '../schemas/checklist.schema.js';
import * as c from '../controllers/checklist.controller.js';

const r = Router();
const id = validate(idParamSchema, 'params');
r.get('/', asyncHandler(c.list));
r.get('/:id', id, asyncHandler(c.getOne));
r.put('/:id', id, validate(updateChecklistSchema), asyncHandler(c.update));
r.delete('/:id', id, asyncHandler(c.remove));
export default r;
