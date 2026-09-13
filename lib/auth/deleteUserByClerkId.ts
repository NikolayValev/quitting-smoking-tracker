import { db } from '@/db';
import { users, smokeLogs } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

/**
 * Removes a user and all of their smoke logs, keyed by Clerk user ID.
 *
 * The logs are deleted explicitly rather than left to the `smoke_logs.user_id`
 * ON DELETE CASCADE. The cascade is the backstop for deletions that bypass this
 * function (manual SQL, a future admin path); this function does not depend on
 * it, because whether that migration has been applied to the live Neon database
 * is still unverified (NIK-54). Both run inside one transaction, so a failure
 * partway through leaves the account intact rather than half-erased.
 *
 * Returns `{ deleted: false }` when no user matches — a normal outcome for a
 * `user.deleted` webhook fired for someone who never wrote a log, and for
 * Clerk's redeliveries of an event already processed.
 *
 * `smokeLogsErased` is counted inside the same transaction that removes the
 * rows, so it describes exactly what this call destroyed rather than what the
 * table happened to hold a moment earlier. It is what lets the deletion receipt
 * state a number the user can check against their export.
 */
export async function deleteUserByClerkId(
  clerkUserId: string,
): Promise<{ deleted: boolean; smokeLogsErased: number }> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existing.length === 0) {
      return { deleted: false, smokeLogsErased: 0 };
    }

    const userId = existing[0].id;

    const counted = await tx
      .select({ value: count() })
      .from(smokeLogs)
      .where(eq(smokeLogs.userId, userId));

    // count() comes back as a bigint string on some drivers; normalise before it
    // reaches the receipt.
    const smokeLogsErased = Number(counted[0]?.value ?? 0);

    await tx.delete(smokeLogs).where(eq(smokeLogs.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));

    return { deleted: true, smokeLogsErased };
  });
}
