import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!url) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
