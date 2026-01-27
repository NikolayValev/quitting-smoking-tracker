'use server';

import { db } from '@/db';
import { smokeLogs } from '@/db/schema';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const createLogSchema = z.object({
  cigarettes: z.number().int().min(0),
  note: z.string().optional(),
  ts: z.string().datetime().optional(),
});

const deleteLogSchema = z.object({
  id: z.string().uuid(),
});

export async function getLogs() {
  try {
    const userId = await getOrCreateUser();

    const logs = await db
      .select()
      .from(smokeLogs)
      .where(eq(smokeLogs.userId, userId))
      .orderBy(desc(smokeLogs.ts));

    return { success: true, data: logs };
  } catch (error) {
    console.error('Error fetching logs:', error);
    return { success: false, error: 'Failed to fetch logs' };
  }
}

export async function createLog(data: unknown) {
  try {
    const userId = await getOrCreateUser();
    const validated = createLogSchema.parse(data);

    const newLog = await db
      .insert(smokeLogs)
      .values({
        userId,
        cigarettes: validated.cigarettes,
        note: validated.note || null,
        ts: validated.ts ? new Date(validated.ts) : new Date(),
      })
      .returning();

    revalidatePath('/app');
    return { success: true, data: newLog[0] };
  } catch (error) {
    console.error('Error creating log:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to create log' };
  }
}

export async function deleteLog(data: unknown) {
  try {
    const userId = await getOrCreateUser();
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
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error deleting log:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to delete log' };
  }
}
