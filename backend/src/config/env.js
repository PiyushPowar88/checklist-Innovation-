import 'dotenv/config';

const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);

export const env = {
  port: num(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ai_checklist_db',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    maxTokens: num(process.env.GROQ_MAX_TOKENS, 6000),
  },
  maxFileSizeMb: num(process.env.MAX_FILE_SIZE_MB, 15),
  maxFiles: num(process.env.MAX_FILES, 10),
  chunkChars: num(process.env.CHUNK_CHARS, 12000),
};
