import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const smokeLogs = pgTable('smoke_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  cigarettes: integer('cigarettes').notNull(),
  note: text('note'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SmokeLog = typeof smokeLogs.$inferSelect;
export type NewSmokeLog = typeof smokeLogs.$inferInsert;
