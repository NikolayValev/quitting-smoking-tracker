import { db } from '@/db';
import { users, smokeLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Bumped whenever the shape below changes, so an old file stays interpretable.
 */
export const EXPORT_FORMAT_VERSION = 1;

/** The profile fields Clerk holds for us, passed in rather than fetched here. */
export type ExportProfile = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type UserDataExport = {
  format: number;
  exportedAt: string;
  account: {
    id: string | null;
    clerkUserId: string;
    createdAt: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  smokeLogs: Array<{
    id: string;
    ts: string;
    cigarettes: number;
    note: string | null;
  }>;
  counts: { smokeLogs: number };
};

/**
 * Collects everything we hold about one person into a single portable object.
 *
 * The Clerk profile is included alongside our own rows because the account page
 * already shows it: from the user's side it is all one account, and an export
 * that omitted their email would not be the copy of their data they asked for.
 * It arrives as an argument so this module stays free of Clerk, matching how the
 * rest of the codebase keeps that dependency at the route boundary.
 *
 * `rate_limits` is deliberately left out. It holds a request count for the
 * current 60-second window and is overwritten in place, so it is operational
 * state that never describes the person or their behaviour beyond this minute.
 *
 * Timestamps are serialised to ISO-8601 strings rather than left as Date
 * objects, so the caller can hand the result straight to JSON.stringify and get
 * a stable, unambiguous file.
 */
export async function exportUserData(
  clerkUserId: string,
  profile: ExportProfile,
): Promise<UserDataExport> {
  const accountRows = await db
    .select({ id: users.id, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  const account = accountRows[0];

  // Signing in does not write a user row — that happens on the first log — so a
  // new account legitimately has none. Their Clerk profile is still their data,
  // so this returns a profile-only export rather than treating it as not found.
  const logs = account
    ? await db
        .select({
          id: smokeLogs.id,
          ts: smokeLogs.ts,
          cigarettes: smokeLogs.cigarettes,
          note: smokeLogs.note,
        })
        .from(smokeLogs)
        .where(eq(smokeLogs.userId, account.id))
        .orderBy(desc(smokeLogs.ts))
    : [];

  return {
    format: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    account: {
      id: account?.id ?? null,
      clerkUserId,
      createdAt: account ? account.createdAt.toISOString() : null,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
    },
    smokeLogs: logs.map((log) => ({
      id: log.id,
      ts: log.ts.toISOString(),
      cigarettes: log.cigarettes,
      note: log.note,
    })),
    counts: { smokeLogs: logs.length },
  };
}
