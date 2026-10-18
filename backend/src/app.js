import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import documentRoutes from './routes/document.routes.js';
import generationRoutes from './routes/generation.routes.js';
import checklistRoutes from './routes/checklist.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 3000 })); // generous: UI polls job status

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'unreachable', error: err.message });
  }
});

app.use('/api/documents', documentRoutes);
app.use('/api/generations', generationRoutes);
app.use('/api/checklists', checklistRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;
