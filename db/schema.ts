import { pgTable, uuid, text, timestamp, integer, index, date, uniqueIndex, numeric } from 'drizzle-orm/pg-core';

/**
 * Settings are all nullable. Someone who never finishes onboarding still gets a
 * working app on the documented fallbacks, so the absence of a setting has to be
 * a legible state rather than a hole to guard against at every call site.
 *
 * There is deliberately no quit date here. The streak comes from the current
 * unbroken run of smoke-free check-ins; a stored date would be a second source
 * of truth for the one number this app must not get wrong.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  /** Cigarettes a day before quitting, as stated rather than inferred. */
  baselinePerDay: integer('baseline_per_day'),
  /** Numeric, not a float: money should not be stored in binary floating point. */
  pricePerPack: numeric('price_per_pack', { precision: 10, scale: 2 }),
  cigarettesPerPack: integer('cigarettes_per_pack').default(20),
  /** ISO 4217, e.g. GBP. Drives Intl.NumberFormat, not a hardcoded symbol. */
  currency: text('currency'),
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
 * `role` is chosen by the owner when inviting. A `buddy` is a peer and sees the
 * streak; a `sponsor` is someone the owner leans on, sees when they slipped,
 * and is the one an "I'm struggling" signal goes to. See SharedSummary and
 * SponsorSummary in lib/buddies.ts for exactly what each may read.
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
    role: text('role', { enum: ['buddy', 'sponsor'] }).default('buddy').notNull(),
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

/**
 * A one-tap message along a share: an "I'm struggling" from the owner to a
 * sponsor, or a preset word of encouragement from a supporter to the owner.
 *
 * `kind` is one of a fixed set rather than free text. Nobody can be sent
 * anything here that was not written by us, so there is nothing to moderate
 * and nothing in this table that describes a person beyond the fact of a tap.
 *
 * Cascades with its link; `deleteUserByClerkId` also clears it explicitly.
 */
export const buddySignals = pgTable(
  'buddy_signals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    linkId: uuid('link_id')
      .references(() => buddyLinks.id, { onDelete: 'cascade' })
      .notNull(),
    fromUserId: uuid('from_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    kind: text('kind', { enum: ['sos', 'proud', 'keep_going', 'here_for_you'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('buddy_signals_link_created_idx').on(table.linkId, table.createdAt)],
);

/**
 * One browser or installed app that has agreed to receive push notifications.
 *
 * `endpoint` is the push service URL for that device and is unique: a device
 * that signs in as someone else moves its row rather than gaining a second
 * one. `p256dh` and `auth` are the device's public keys for encrypting
 * messages to it. They are not secrets of ours, but they are not exported
 * either, since they mean nothing outside a push service.
 *
 * Rows are removed when the push service reports the subscription gone (404
 * or 410), when the person turns alerts off, or with the account.
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    endpoint: text('endpoint').unique().notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('push_subscriptions_user_idx').on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SmokeLog = typeof smokeLogs.$inferSelect;
export type NewSmokeLog = typeof smokeLogs.$inferInsert;
export type BuddyLink = typeof buddyLinks.$inferSelect;
export type NewBuddyLink = typeof buddyLinks.$inferInsert;
export type BuddySignal = typeof buddySignals.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
