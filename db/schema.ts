import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const smokeLogs = pgTable('smoke_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  cigarettes: integer('cigarettes').notNull(),
  note: text('note'),
});

/**
 * One row per rate-limited subject, reused for the life of that subject.
 *
 * Deliberately not an event log: storing a row per request would grow without
 * bound and need pruning, where this is overwritten in place and stays at one
 * row per user. See lib/rate-limit.ts.
 */
export const rateLimits = pgTable('rate_limits', {
  subject: text('subject').primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).defaultNow().notNull(),
  count: integer('count').default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SmokeLog = typeof smokeLogs.$inferSelect;
export type NewSmokeLog = typeof smokeLogs.$inferInsert;
