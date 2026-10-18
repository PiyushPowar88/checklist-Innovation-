import { env } from './src/config/env.js';
import app from './src/app.js';
import { testConnection } from './src/config/db.js';
import { failStuckJobs } from './src/repositories/generation.repository.js';

async function start() {
  try {
    await testConnection();
    console.log('✔ MySQL connected');
    const stuck = await failStuckJobs();
    if (stuck) console.log(`ℹ Marked ${stuck} interrupted generation job(s) as failed`);
  } catch (err) {
    console.error('✖ Database connection failed:', err.message);
    console.error('  Check DB_* values in backend/.env and that schema.sql was executed.');
    process.exit(1);
  }
  app.listen(env.port, () => console.log(`✔ API running on http://localhost:${env.port}`));
}
start();
