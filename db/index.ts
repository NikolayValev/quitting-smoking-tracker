import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('DATABASE_URL environment variable must be set');
  }
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(databaseUrl ?? 'postgresql://dummy:dummy@localhost:5432/dummy', { prepare: false });
export const db = drizzle(client, { schema });
