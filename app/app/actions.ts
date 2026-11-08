'use server';

import { db } from '@/db';
import { smokeLogs } from '@/db/schema';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability/logger';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

/** A calendar day, as the client's own local date. */
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date');

/**
 * A count per substance, each left out (or null) when the person is not
 * quitting it. One of them has to be there: a check-in about nothing would
 * fail the table's check constraint anyway, and should fail here first.
 */
const counts = {
  cigarettes: z.number().int().min(0).nullable().optional(),
  /** Times cannabis was used. */
  sessions: z.number().int().min(0).nullable().optional(),
};
const hasACount = (data: { cigarettes?: number | null; sessions?: number | null }) =>
  data.cigarettes != null || data.sessions != null;
const NO_COUNT = { message: 'Expected a count for at least one substance' };

const createLogSchema = z
  .object({
    ...counts,
    note: z.string().optional(),
    /** Which day this is about. Defaults to the server's today when omitted. */
    date: daySchema.optional(),
  })
  .refine(hasACount, NO_COUNT);

const updateLogSchema = z
  .object({
    id: z.string().uuid(),
    ...counts,
    note: z.string().optional(),
  })
  .refine(hasACount, NO_COUNT);

const deleteLogSchema = z.object({
  id: z.string().uuid(),
});

// Writes only. getLogs runs on every page render, so metering it would spend a
// user's budget just by them looking at their own data.
const RATE_LIMITED = 'Too many requests. Please wait a moment and try again.';

/** Today as YYYY-MM-DD, used when the client does not say which day it means. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getLogs() {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const logs = await db
      .select()
      .from(smokeLogs)
      .where(eq(smokeLogs.userId, userId))
      .orderBy(desc(smokeLogs.ts));

    return { success: true, data: logs };
  } catch (error) {
    logError('get_logs_failed', error, { userId });
    return { success: false, error: 'Failed to fetch logs' };
  }
}

export async function createLog(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) {
      return { success: false, error: RATE_LIMITED };
    }

    const validated = createLogSchema.parse(data);
    const logDate = validated.date ?? todayISO();

    // Midday UTC, so the timestamp lands on the intended day whichever side of
    // the date line it is read from. Nothing displays a time; ts exists to order
    // entries and to place them on the chart.
    const ts = new Date(`${logDate}T12:00:00.000Z`);

    // One check-in per day: logging a day twice replaces it rather than adding
    // a second entry, which is what anyone would expect and what the unique
    // index on (user_id, log_date) requires.
    // Absent means "not asked", stored as null, never as zero.
    const values = {
      cigarettes: validated.cigarettes ?? null,
      sessions: validated.sessions ?? null,
      note: validated.note || null,
    };
    const newLog = await db
      .insert(smokeLogs)
      .values({ userId, ...values, logDate, ts })
      .onConflictDoUpdate({
        target: [smokeLogs.userId, smokeLogs.logDate],
        set: { ...values, ts },
      })
      .returning();

    revalidatePath('/app');
    revalidatePath('/dashboard');
    return { success: true, data: newLog[0] };
  } catch (error) {
    logError('create_log_failed', error, { userId });
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to create log' };
  }
}

export async function updateLog(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) {
      return { success: false, error: RATE_LIMITED };
    }

    const validated = updateLogSchema.parse(data);

    // Ownership is part of the where clause rather than a prior read: a check
    // followed by a write can be raced, and this cannot.
    const result = await db
      .update(smokeLogs)
      .set({
        cigarettes: validated.cigarettes ?? null,
        sessions: validated.sessions ?? null,
        note: validated.note || null,
      })
      .where(and(eq(smokeLogs.id, validated.id), eq(smokeLogs.userId, userId)))
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Log not found or unauthorized' };
    }

    revalidatePath('/app');
    revalidatePath('/dashboard');
    return { success: true, data: result[0] };
  } catch (error) {
    logError('update_log_failed', error, { userId });
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to update log' };
  }
}

export async function deleteLog(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) {
      return { success: false, error: RATE_LIMITED };
    }

    const validated = deleteLogSchema.parse(data);

    // Ensure the log belongs to the user before deleting
    const result = await db
      .delete(smokeLogs)
      .where(and(eq(smokeLogs.id, validated.id), eq(smokeLogs.userId, userId)))
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Log not found or unauthorized' };
    }

    revalidatePath('/app');
    revalidatePath('/dashboard');
    return { success: true, data: result[0] };
  } catch (error) {
    logError('delete_log_failed', error, { userId });
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to delete log' };
  }
}
