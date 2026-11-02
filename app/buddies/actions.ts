'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { consumeRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability/logger';
import { acceptInvite, createInvite, revokeLink } from '@/lib/buddies';
import { sendCheer, sendSos } from '@/lib/buddy-signals';
import { pushToUsers } from '@/lib/push';
import { cheerMessage, sosMessage } from '@/lib/push-messages';

const RATE_LIMITED = 'Too many requests. Please wait a moment and try again.';

/**
 * Minting invites is metered on its own subject and far more tightly than the
 * write budget. Each one is a live key to a streak until it expires, and there
 * is no legitimate reason to need several an hour.
 */
const INVITE_LIMIT = 5;
const INVITE_WINDOW_SECONDS = 60 * 60;

/**
 * Signals share one budget, apart from writes. Generous enough that nobody
 * asking for help is ever turned away in an ordinary hour, tight enough that
 * a supporter cannot be flooded.
 */
const SIGNAL_LIMIT = 20;
const SIGNAL_WINDOW_SECONDS = 60 * 60;

const inviteSchema = z
  .object({ role: z.enum(['buddy', 'sponsor']).default('buddy') })
  .default({ role: 'buddy' });

const cheerSchema = z.object({
  linkId: z.string().uuid(),
  kind: z.enum(['proud', 'keep_going', 'here_for_you']),
});

const acceptSchema = z.object({
  code: z.string().min(8).max(64),
});

const revokeSchema = z.object({
  linkId: z.string().uuid(),
});

export async function createBuddyInvite(data?: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();
    const { role } = inviteSchema.parse(data);

    const rate = await consumeRateLimit(`invite:${userId}`, {
      limit: INVITE_LIMIT,
      windowSeconds: INVITE_WINDOW_SECONDS,
    });
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const { code, expiresAt } = await createInvite(userId, role);

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

/** Pushes to devices, swallowing failures. The in-app signal is the record. */
async function notify(
  recipients: string[],
  message: Parameters<typeof pushToUsers>[1],
  userId: string,
) {
  try {
    await pushToUsers(recipients, message);
  } catch (error) {
    logError('buddy_push_failed', error, { userId });
  }
}

async function signalBudget(userId: string) {
  return consumeRateLimit(`signal:${userId}`, {
    limit: SIGNAL_LIMIT,
    windowSeconds: SIGNAL_WINDOW_SECONDS,
  });
}

export async function sendSosSignal() {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await signalBudget(userId);
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const { sent, recipients } = await sendSos(userId);
    if (sent === 0) {
      return { success: false as const, error: 'Invite a sponsor first, so there is someone to tell.' };
    }

    // The signal is already written, so a push failure must not undo it or
    // tell the person it did not send. It is logged and the SOS stands.
    await notify(recipients, sosMessage(), userId);

    revalidatePath('/buddies');
    return { success: true as const, data: { sent } };
  } catch (error) {
    logError('buddy_sos_failed', error, { userId });
    return { success: false as const, error: 'Could not send that. Try again, or call them.' };
  }
}

export async function sendCheerSignal(data: unknown) {
  let userId: string | undefined;
  try {
    userId = await getOrCreateUser();

    const rate = await signalBudget(userId);
    if (!rate.allowed) {
      return { success: false as const, error: RATE_LIMITED };
    }

    const { linkId, kind } = cheerSchema.parse(data);
    const result = await sendCheer(linkId, userId, kind);

    if (!result.sent) {
      // Same answer whether the link is missing or not theirs, as for revoking.
      return { success: false as const, error: 'Could not send that' };
    }

    await notify([result.recipient], cheerMessage(kind), userId);

    revalidatePath('/buddies');
    return { success: true as const };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error: 'Could not send that' };
    }
    logError('buddy_cheer_failed', error, { userId });
    return { success: false as const, error: 'Could not send that' };
  }
}
