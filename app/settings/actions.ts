'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability/logger';

const RATE_LIMITED = 'Too many requests. Please wait a moment and try again.';

const settingsSchema = z.object({
  // Generous upper bounds rather than tight ones: the job here is to reject
  // nonsense that would corrupt the arithmetic, not to tell somebody their
  // habit is implausible.
  baselinePerDay: z.number().int().min(1).max(200).nullable().optional(),
  pricePerPack: z.number().min(0.01).max(1000).nullable().optional(),
  cigarettesPerPack: z.number().int().min(1).max(100).optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Expected a three-letter currency code')
    .optional(),
});

export async function saveSettings(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const validated = settingsSchema.parse(data);

    await db
      .update(users)
      .set({
        ...(validated.baselinePerDay !== undefined
          ? { baselinePerDay: validated.baselinePerDay }
          : {}),
        // numeric takes a string, keeping money out of binary floating point on
        // the way in as well as on the way out.
        ...(validated.pricePerPack !== undefined
          ? {
              pricePerPack:
                validated.pricePerPack === null ? null : validated.pricePerPack.toFixed(2),
            }
          : {}),
        ...(validated.cigarettesPerPack !== undefined
          ? { cigarettesPerPack: validated.cigarettesPerPack }
          : {}),
        ...(validated.currency !== undefined ? { currency: validated.currency } : {}),
      })
      .where(eq(users.id, userId));

    revalidatePath('/dashboard');
    revalidatePath('/account');
    return { success: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error: error.errors[0]?.message ?? 'Invalid input' };
    }
    logError('save_settings_failed', error, { userId });
    return { success: false as const, error: 'Could not save those settings' };
  }
}
