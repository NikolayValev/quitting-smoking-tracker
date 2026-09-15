import { pgTable, uuid, text, timestamp, integer, index, date, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * One check-in per person per day.
 *
 * `logDate` is the day the check-in is *about*, as a plain date, and it is what
 * uniqueness is enforced on. It is stored rather than derived from `ts` for two
 * reasons: casting a timestamptz to a date depends on the session time zone, so
 * Postgres will not accept it in an index; and the day someone means is their
 * local day, which a UTC timestamp cannot be trusted to give back.
 *
 * `ts` remains the point on the timeline, used for ordering and the chart.
 */
export const smokeLogs = pgTable(
  'smoke_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    logDate: date('log_date').notNull(),
    cigarettes: integer('cigarettes').notNull(),
    note: text('note'),
  },
  (table) => [uniqueIndex('smoke_logs_user_day_idx').on(table.userId, table.logDate)],
);

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

/**
 * One person letting one other person see how they are doing.
 *
 * `ownerUserId` is the person quitting, whose progress is shared.
 * `buddyUserId` is who may see it — null until the invite is accepted.
 *
 * The invite code is never stored. `codeHash` holds its SHA-256, and the code
 * itself is shown once at generation: a table of live invite codes is a table
 * of keys to other people's health data, and there is no reason to keep one.
 *
 * Revoking sets `revokedAt` rather than deleting the row, so a share that
 * existed stays auditable from the owner's side. Both columns cascade on user
 * deletion; `deleteUserByClerkId` also clears them explicitly rather than
 * relying on that, matching how it treats smoke_logs.
 */
export const buddyLinks = pgTable(
  'buddy_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    buddyUserId: uuid('buddy_user_id').references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').unique().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('buddy_links_owner_idx').on(table.ownerUserId),
    index('buddy_links_buddy_idx').on(table.buddyUserId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SmokeLog = typeof smokeLogs.$inferSelect;
export type NewSmokeLog = typeof smokeLogs.$inferInsert;
export type BuddyLink = typeof buddyLinks.$inferSelect;
export type NewBuddyLink = typeof buddyLinks.$inferInsert;
