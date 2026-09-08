import { db } from '@/db';
import { users, smokeLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
 */
export async function deleteUserByClerkId(clerkUserId: string): Promise<{ deleted: boolean }> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existing.length === 0) {
      return { deleted: false };
    }

    const userId = existing[0].id;

    await tx.delete(smokeLogs).where(eq(smokeLogs.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));

    return { deleted: true };
  });
}
