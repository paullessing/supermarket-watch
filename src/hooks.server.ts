import { initDb } from '$lib/server/db/db.providers';

/**
 * Run at server startup.
 */
await initMongoDb();

async function initMongoDb(): Promise<void> {
  console.info('Initialising MongoDB');
  const serverName = await initDb();
  console.info(`Connected to MongoDB at ${serverName}`);
}
