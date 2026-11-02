'use server';

import { z } from 'zod';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability/logger';
import { removeSubscription, saveSubscription } from '@/lib/push';

const RATE_LIMITED = 'Too many requests. Please wait a moment and try again.';

/**
 * The shape PushSubscription.toJSON() produces. The endpoint must be https:
 * every real push service is, and anything else would have this server POST
 * to an address of the caller's choosing.
 */
const subscriptionSchema = z.object({
  endpoint: z
    .string()
    .url()
    .max(2048)
    .refine((url) => url.startsWith('https://'), 'endpoint must be https'),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

const endpointSchema = z.object({ endpoint: z.string().url().max(2048) });

export async function savePushSubscription(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) return { success: false as const, error: RATE_LIMITED };

    const subscription = subscriptionSchema.parse(data);
    await saveSubscription(userId, subscription);
    return { success: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error: 'This browser sent something unexpected.' };
    }
    logError('push_subscribe_failed', error, { userId });
    return { success: false as const, error: 'Could not turn on alerts' };
  }
}

export async function removePushSubscription(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) return { success: false as const, error: RATE_LIMITED };

    const { endpoint } = endpointSchema.parse(data);
    await removeSubscription(userId, endpoint);
    return { success: true as const };
  } catch (error) {
    logError('push_unsubscribe_failed', error, { userId });
    return { success: false as const, error: 'Could not turn off alerts' };
  }
}
