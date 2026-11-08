import 'server-only';
import { and, eq, exists, inArray, isNotNull, max, sql } from 'drizzle-orm';
import { db } from '@/db';
import { pushSubscriptions, smokeLogs, users } from '@/db/schema';
import { isReminderDue, localDay } from '@/lib/checkin-reminder';
import { pushToUsers, type PushDelivery } from '@/lib/push';
import { checkinReminderMessage } from '@/lib/push-messages';

/**
 * A reminder held by a push service for a phone that is off would arrive late
 * in the evening or overnight. Better dropped: let it lapse after three hours,
 * and do not wake a device that is saving power for it.
 */
const REMINDER_DELIVERY: PushDelivery = { ttlSeconds: 3 * 60 * 60, urgency: 'normal' };

export async function getCheckinReminder(userId: string): Promise<boolean> {
  const rows = await db
    .select({ timeZone: users.reminderTimeZone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(rows[0]?.timeZone);
}

/** Turns the reminder on in `timeZone`, or off with null. */
export async function setCheckinReminder(userId: string, timeZone: string | null): Promise<void> {
  await db.update(users).set({ reminderTimeZone: timeZone }).where(eq(users.id, userId));
}

/**
 * Reminds everyone who asked to be and has not checked in today, on each of
 * their devices. Run once a day by Vercel Cron (app/api/cron/checkin-reminder).
 *
 * Each person is marked reminded *before* the push goes out, so a repeated cron
 * delivery cannot send twice. If a push then fails, that day's reminder is lost,
 * which is the better failure: a missed nudge costs nothing, a double one is
 * the kind of thing that gets notifications turned off.
 */
export async function sendCheckinReminders(
  now: Date = new Date(),
): Promise<{ due: number; delivered: number; removed: number }> {
  // Only people with a device to reach. Without one there is nothing to send,
  // and marking them reminded would only make the column lie.
  const candidates = await db
    .select({
      id: users.id,
      timeZone: users.reminderTimeZone,
      remindedOn: users.remindedOn,
      lastLogDate: max(smokeLogs.logDate),
    })
    .from(users)
    .leftJoin(smokeLogs, eq(smokeLogs.userId, users.id))
    .where(
      and(
        isNotNull(users.reminderTimeZone),
        exists(
          db
            .select({ one: sql`1` })
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, users.id)),
        ),
      ),
    )
    .groupBy(users.id);

  // Grouped by the local date being marked: everyone due in one run shares at
  // most a couple of dates, so this is a handful of updates, not one per person.
  const dueByDate = new Map<string, string[]>();
  for (const row of candidates) {
    const timeZone = row.timeZone!;
    if (!isReminderDue({ now, timeZone, lastLogDate: row.lastLogDate, remindedOn: row.remindedOn })) {
      continue;
    }
    const { date } = localDay(now, timeZone);
    dueByDate.set(date, [...(dueByDate.get(date) ?? []), row.id]);
  }

  const due = [...dueByDate.values()].flat();
  if (due.length === 0) return { due: 0, delivered: 0, removed: 0 };

  for (const [date, ids] of dueByDate) {
    await db.update(users).set({ remindedOn: date }).where(inArray(users.id, ids));
  }

  const result = await pushToUsers(due, checkinReminderMessage(), REMINDER_DELIVERY);
  return { due: due.length, ...result };
}
