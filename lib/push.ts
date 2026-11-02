import 'server-only';
import webpush from 'web-push';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import type { PushMessage } from '@/lib/push-messages';

/**
 * Web push with keys we generate ourselves (VAPID), so there is no provider
 * and nothing to pay for: browsers' own push services carry the message.
 *
 * Generate the pair once with `pnpm exec web-push generate-vapid-keys` and set
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. Until both are set, push
 * is off. Nothing fails; the in-app signals on /buddies still work.
 */
export function pushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return {
    publicKey,
    privateKey,
    // Push services want a way to reach whoever runs the sender. A URL is
    // allowed in place of an email address, so none needs to be published.
    subject:
      process.env.VAPID_SUBJECT ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'https://smoking.nikolayvalev.com',
  };
}

export type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Stores a device for `userId`, moving it if it was someone else's before. */
export async function saveSubscription(userId: string, sub: SubscriptionInput): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

/** Removes a device, but only if it belongs to `userId`. */
export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  const rows = await db
    .select({ id: pushSubscriptions.id, userId: pushSubscriptions.userId })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);
  if (rows[0] && rows[0].userId === userId) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, rows[0].id));
  }
}

/** Status codes with which a push service says a subscription no longer exists. */
const GONE = new Set([404, 410]);

/**
 * Sends `message` to every device of every user in `userIds`.
 *
 * Never throws for a delivery failure: a notification is a courtesy on top of
 * the in-app signal, which has already been written. Devices the push service
 * reports as gone are deleted, so the table does not fill with dead phones.
 */
export async function pushToUsers(
  userIds: string[],
  message: PushMessage,
): Promise<{ delivered: number; removed: number }> {
  const config = pushConfig();
  if (!config || userIds.length === 0) return { delivered: 0, removed: 0 };

  const devices = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  const results = await Promise.allSettled(
    devices.map((device) =>
      webpush.sendNotification(
        { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
        JSON.stringify(message),
        {
          vapidDetails: config,
          // An SOS a day late is worse than none; let it lapse after 12 hours.
          TTL: 12 * 60 * 60,
          urgency: 'high',
        },
      ),
    ),
  );

  const gone = devices.filter((_, i) => {
    const result = results[i];
    return (
      result.status === 'rejected' &&
      GONE.has((result.reason as { statusCode?: number })?.statusCode ?? 0)
    );
  });

  if (gone.length > 0) {
    await db.delete(pushSubscriptions).where(
      inArray(
        pushSubscriptions.id,
        gone.map((device) => device.id),
      ),
    );
  }

  return {
    delivered: results.filter((r) => r.status === 'fulfilled').length,
    removed: gone.length,
  };
}
