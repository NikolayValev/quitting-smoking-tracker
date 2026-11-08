'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability/logger';
import { CRAVING_OUTCOMES, CRAVING_TRIGGERS } from '@/lib/cravings';
import { recordCraving as storeCraving } from '@/lib/cravings.server';

const RATE_LIMITED = 'Too many requests. Please wait a moment and try again.';

const cravingSchema = z.object({
  trigger: z.enum(CRAVING_TRIGGERS),
  strength: z.number().int().min(1).max(5),
  outcome: z.enum(CRAVING_OUTCOMES),
  /** The hour on the person's own clock; see the cravings table. */
  localHour: z.number().int().min(0).max(23),
});

export async function recordCraving(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) return { success: false as const, error: RATE_LIMITED };

    const craving = cravingSchema.parse(data);
    await storeCraving(userId, craving);
    revalidatePath('/app');
    return { success: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error: 'That craving could not be recorded.' };
    }
    logError('craving_record_failed', error, { userId });
    return { success: false as const, error: 'Could not record the craving' };
  }
}
