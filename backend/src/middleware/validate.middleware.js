import { AppError } from '../utils/errors.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.') || source}: ${i.message}`);
    return next(new AppError(400, 'Invalid request', details));
  }
  if (source === 'body') req.body = result.data;
  next();
};
