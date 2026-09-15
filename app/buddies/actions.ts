'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability/logger';
import { acceptInvite, createInvite, revokeLink } from '@/lib/buddies';

const RATE_LIMITED = 'Too many requests. Please wait a moment and try again.';

/**
 * Minting invites is metered on its own subject and far more tightly than the
 * write budget. Each one is a live key to a streak until it expires, and there
 * is no legitimate reason to need several an hour.
 */
const INVITE_LIMIT = 5;
const INVITE_WINDOW_SECONDS = 60 * 60;

const acceptSchema = z.object({
  code: z.string().min(8).max(64),
});

const revokeSchema = z.object({
  linkId: z.string().uuid(),
});

export async function createBuddyInvite() {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`invite:${userId}`, {
      limit: INVITE_LIMIT,
      windowSeconds: INVITE_WINDOW_SECONDS,
    });
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const { code, expiresAt } = await createInvite(userId);

    revalidatePath('/buddies');
    // The only time this code is ever returned. It is not stored, so it cannot
    // be shown again — the UI has to make that clear.
    return { success: true as const, data: { code, expiresAt: expiresAt.toISOString() } };
  } catch (error) {
    logError('buddy_invite_failed', error, { userId });
    return { success: false as const, error: 'Could not create an invite' };
  }
}

const ACCEPT_ERRORS: Record<string, string> = {
  not_found: 'That code is not valid.',
  expired: 'That invite has expired. Ask for a new one.',
  revoked: 'That invite was cancelled.',
  already_accepted: 'That invite has already been used.',
  self: 'You cannot be your own buddy.',
};

export async function acceptBuddyInvite(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`invite-accept:${userId}`);
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const { code } = acceptSchema.parse(data);
    const result = await acceptInvite(code, userId);

    if (!result.ok) {
      // A wrong code is an ordinary outcome, not a fault worth logging.
      return { success: false as const, error: ACCEPT_ERRORS[result.reason] };
    }

    revalidatePath('/buddies');
    return { success: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error: 'That code is not valid.' };
    }
    logError('buddy_accept_failed', error, { userId });
    return { success: false as const, error: 'Could not accept that invite' };
  }
}

export async function revokeBuddyLink(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await consumeRateLimit(`user:${userId}`);
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const { linkId } = revokeSchema.parse(data);
    const { revoked } = await revokeLink(linkId, userId);

    if (!revoked) {
      // Either it does not exist or it is not theirs to end. Both answer the
      // same, so this cannot be used to discover other people's links.
      return { success: false as const, error: 'Could not stop that share' };
    }

    revalidatePath('/buddies');
    return { success: true as const };
  } catch (error) {
    logError('buddy_revoke_failed', error, { userId });
    return { success: false as const, error: 'Could not stop that share' };
  }
}
