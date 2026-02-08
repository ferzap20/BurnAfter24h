import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`[Server] Burn After 24h API running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
