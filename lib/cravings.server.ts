import 'server-only';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import { cravings } from '@/db/schema';
import { PATTERN_DAYS, type CravingRecord } from '@/lib/cravings';

export async function recordCraving(
  userId: string,
  craving: Omit<CravingRecord, 'createdAt'>,
): Promise<void> {
  await db.insert(cravings).values({ userId, ...craving });
}

/** This person's cravings over the pattern window, newest first. */
export async function recentCravings(
  userId: string,
  now: Date = new Date(),
): Promise<CravingRecord[]> {
  const since = new Date(now.getTime() - PATTERN_DAYS * 24 * 60 * 60 * 1000);
  return db
    .select({
      createdAt: cravings.createdAt,
      trigger: cravings.trigger,
      strength: cravings.strength,
      outcome: cravings.outcome,
      localHour: cravings.localHour,
    })
    .from(cravings)
    .where(and(eq(cravings.userId, userId), gte(cravings.createdAt, since)))
    .orderBy(desc(cravings.createdAt));
}
