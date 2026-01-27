import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// In production, DATABASE_URL must be set
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL environment variable must be set in production');
}

// Allow builds without DATABASE_URL in development (will fail at runtime if actually used)
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(databaseUrl, { prepare: false });
export const db = drizzle(client, { schema });
