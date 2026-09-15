import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { buddyLinks, smokeLogs, users, type BuddyLink } from '@/db/schema';
import { deriveDashboardStats, type DashboardLog } from '@/lib/dashboard-stats';
import { milestonesReached, MILESTONE_COUNT } from '@/lib/milestones';

/** How long an unaccepted invite stays usable. */
export const INVITE_TTL_DAYS = 7;

const DAY_MS = 86_400_000;

/**
 * Everything a buddy is allowed to know.
 *
 * Deliberately not derived from the log rows by spreading: each field is named,
 * so adding a column to smoke_logs cannot widen what a buddy sees. Notes and
 * per-day counts are not here and must not be added — the share was offered on
 * the promise that they are not.
 */
export type SharedSummary = {
  smokeFreeDays: number;
  quitDate: string | null;
  milestonesReached: number;
  milestoneCount: number;
};

export type LinkState = 'active' | 'pending' | 'expired' | 'revoked';

/**
 * Whether a link currently grants access, and if not, why.
 *
 * The expiry window applies to *accepting* an invite, not to how long a buddy
 * may watch afterwards. An accepted share lasts until somebody revokes it;
 * quietly cutting people off a week later would look like a bug to both of them.
 */
export function linkState(link: BuddyLink, now: Date = new Date()): LinkState {
  if (link.revokedAt) return 'revoked';
  if (link.acceptedAt) return 'active';
  if (link.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'pending';
}

/** Reduces a log list to the four fields a buddy sees. */
export function toSharedSummary(logs: DashboardLog[], now: Date = new Date()): SharedSummary {
  const stats = deriveDashboardStats(logs, now);
  const minutes = stats.smokeFreeDays * 1440 + stats.smokeFreeHours * 60;

  return {
    smokeFreeDays: stats.smokeFreeDays,
    quitDate: stats.quitDate ? stats.quitDate.toISOString() : null,
    milestonesReached: milestonesReached(minutes),
    milestoneCount: MILESTONE_COUNT,
  };
}

/** URL-safe, no vowels and no look-alike characters, so it survives being read aloud. */
const ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXZ';

function newCode(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/**
 * SHA-256, via Web Crypto rather than node:crypto so this is not pinned to the
 * Node runtime. Not a password hash on purpose: the code is high-entropy and
 * single-use, so there is nothing to brute force, and lookup has to be a plain
 * indexed equality match.
 */
async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mints an invite. The plaintext code is returned once and never stored — a
 * table of live invite codes would be a table of keys to other people's health
 * data.
 */
export async function createInvite(
  ownerUserId: string,
  now: Date = new Date(),
): Promise<{ code: string; expiresAt: Date }> {
  const code = newCode();
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * DAY_MS);

  await db.insert(buddyLinks).values({
    ownerUserId,
    codeHash: await hashCode(code),
    expiresAt,
  });

  return { code, expiresAt };
}

export type AcceptResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'expired' | 'revoked' | 'already_accepted' | 'self' };

/**
 * Accepts an invite on behalf of `buddyUserId`.
 *
 * The final update is conditioned on the row still being unaccepted, so two
 * people racing the same code cannot both win — the second update matches no
 * rows rather than overwriting the first.
 */
export async function acceptInvite(
  code: string,
  buddyUserId: string,
  now: Date = new Date(),
): Promise<AcceptResult> {
  const codeHash = await hashCode(code.trim().toUpperCase());

  const found = await db
    .select()
    .from(buddyLinks)
    .where(eq(buddyLinks.codeHash, codeHash))
    .limit(1);

  const link = found[0];
  if (!link) return { ok: false, reason: 'not_found' };
  if (link.ownerUserId === buddyUserId) return { ok: false, reason: 'self' };

  const state = linkState(link, now);
  if (state === 'revoked') return { ok: false, reason: 'revoked' };
  if (state === 'expired') return { ok: false, reason: 'expired' };
  if (state === 'active') return { ok: false, reason: 'already_accepted' };

  const updated = await db
    .update(buddyLinks)
    .set({ buddyUserId, acceptedAt: now })
    .where(and(eq(buddyLinks.id, link.id), isNull(buddyLinks.acceptedAt)))
    .returning({ id: buddyLinks.id });

  return updated.length > 0 ? { ok: true } : { ok: false, reason: 'already_accepted' };
}

export type BuddyRow = {
  linkId: string;
  clerkUserId: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
  state: LinkState;
};

/** People this user has invited — accepted or still pending. */
export async function listBuddies(
  ownerUserId: string,
  now: Date = new Date(),
): Promise<BuddyRow[]> {
  const rows = await db
    .select({ link: buddyLinks, clerkUserId: users.clerkUserId })
    .from(buddyLinks)
    .leftJoin(users, eq(users.id, buddyLinks.buddyUserId))
    .where(and(eq(buddyLinks.ownerUserId, ownerUserId), isNull(buddyLinks.revokedAt)))
    .orderBy(desc(buddyLinks.createdAt));

  return rows.map(({ link, clerkUserId }) => ({
    linkId: link.id,
    clerkUserId,
    acceptedAt: link.acceptedAt,
    expiresAt: link.expiresAt,
    state: linkState(link, now),
  }));
}

/** People whose progress this user can see. */
export async function listSupporting(
  buddyUserId: string,
  now: Date = new Date(),
): Promise<Array<BuddyRow & { ownerUserId: string }>> {
  const rows = await db
    .select({ link: buddyLinks, clerkUserId: users.clerkUserId })
    .from(buddyLinks)
    .innerJoin(users, eq(users.id, buddyLinks.ownerUserId))
    .where(and(eq(buddyLinks.buddyUserId, buddyUserId), isNull(buddyLinks.revokedAt)))
    .orderBy(desc(buddyLinks.acceptedAt));

  return rows.map(({ link, clerkUserId }) => ({
    linkId: link.id,
    ownerUserId: link.ownerUserId,
    clerkUserId,
    acceptedAt: link.acceptedAt,
    expiresAt: link.expiresAt,
    state: linkState(link, now),
  }));
}

/**
 * Ends a share. Either side may do it — being watched is not something only the
 * watcher gets to stop.
 */
export async function revokeLink(
  linkId: string,
  byUserId: string,
  now: Date = new Date(),
): Promise<{ revoked: boolean }> {
  const found = await db.select().from(buddyLinks).where(eq(buddyLinks.id, linkId)).limit(1);
  const link = found[0];

  if (!link) return { revoked: false };
  if (link.ownerUserId !== byUserId && link.buddyUserId !== byUserId) {
    return { revoked: false };
  }

  await db.update(buddyLinks).set({ revokedAt: now }).where(eq(buddyLinks.id, linkId));
  return { revoked: true };
}

/**
 * What `buddyUserId` may see of `ownerUserId`.
 *
 * Permission is checked before the logs are read, not after. Reading first and
 * filtering afterwards is how data reaches places it should not — and it means
 * a thrown error midway has already loaded somebody's diary into memory.
 */
export async function getSharedSummary(
  ownerUserId: string,
  buddyUserId: string,
  now: Date = new Date(),
): Promise<SharedSummary | null> {
  const found = await db
    .select()
    .from(buddyLinks)
    .where(
      and(
        eq(buddyLinks.ownerUserId, ownerUserId),
        eq(buddyLinks.buddyUserId, buddyUserId),
        isNull(buddyLinks.revokedAt),
      ),
    )
    .limit(1);

  const link = found[0];
  if (!link || linkState(link, now) !== 'active') return null;

  const logs = await db
    .select({ id: smokeLogs.id, ts: smokeLogs.ts, cigarettes: smokeLogs.cigarettes })
    .from(smokeLogs)
    .where(eq(smokeLogs.userId, ownerUserId))
    .orderBy(desc(smokeLogs.ts));

  return toSharedSummary(logs, now);
}

/** Every link this user is on, either side. Used by account deletion and export. */
export async function linksForUser(userId: string): Promise<BuddyLink[]> {
  const owned = await db.select().from(buddyLinks).where(eq(buddyLinks.ownerUserId, userId));
  const supporting = await db.select().from(buddyLinks).where(eq(buddyLinks.buddyUserId, userId));
  return [...owned, ...supporting];
}
