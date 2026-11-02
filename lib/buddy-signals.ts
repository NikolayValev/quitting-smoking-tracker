import { and, desc, eq, gte, isNotNull, isNull, ne, or } from 'drizzle-orm';
import { db } from '@/db';
import { buddyLinks, buddySignals, type BuddySignal } from '@/db/schema';
import { linkState } from '@/lib/buddies';

export type SignalKind = BuddySignal['kind'];
export type CheerKind = Exclude<SignalKind, 'sos'>;

/** How long a signal stays on screen. Older ones are kept for export but not shown. */
export const SIGNAL_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;

/**
 * Sends "I'm struggling" to every active sponsor this person has.
 *
 * Fanned out to all of them rather than one: the point is that somebody sees
 * it soon, and the person asking is in no state to pick who.
 */
export async function sendSos(
  ownerUserId: string,
  now: Date = new Date(),
): Promise<{ sent: number; recipients: string[] }> {
  const sponsors = await db
    .select({ id: buddyLinks.id, buddyUserId: buddyLinks.buddyUserId })
    .from(buddyLinks)
    .where(
      and(
        eq(buddyLinks.ownerUserId, ownerUserId),
        eq(buddyLinks.role, 'sponsor'),
        isNotNull(buddyLinks.acceptedAt),
        isNull(buddyLinks.revokedAt),
      ),
    );

  if (sponsors.length === 0) return { sent: 0, recipients: [] };

  await db.insert(buddySignals).values(
    sponsors.map((link) => ({
      linkId: link.id,
      fromUserId: ownerUserId,
      kind: 'sos' as const,
      createdAt: now,
    })),
  );

  return {
    sent: sponsors.length,
    // Who to notify. Accepted links always have a buddy; the filter is for the type.
    recipients: sponsors.map((link) => link.buddyUserId).filter((id): id is string => id !== null),
  };
}

/**
 * Sends a preset word of encouragement along one link.
 *
 * Only the supporting side may send one, and only on a link that is live. The
 * check reads the link first, as getSharedSummary does, so a guessed link id
 * cannot be used to put a message in front of a stranger.
 */
export async function sendCheer(
  linkId: string,
  fromUserId: string,
  kind: CheerKind,
  now: Date = new Date(),
): Promise<{ sent: false } | { sent: true; recipient: string }> {
  const found = await db.select().from(buddyLinks).where(eq(buddyLinks.id, linkId)).limit(1);
  const link = found[0];

  if (!link || link.buddyUserId !== fromUserId || linkState(link, now) !== 'active') {
    return { sent: false };
  }

  await db.insert(buddySignals).values({ linkId, fromUserId, kind, createdAt: now });
  return { sent: true, recipient: link.ownerUserId };
}

export type ReceivedSignal = {
  id: string;
  linkId: string;
  kind: SignalKind;
  createdAt: Date;
};

/**
 * Signals addressed to this person within the window: encouragement on links
 * they own, and calls for help on links where they are the supporter.
 *
 * A revoked link takes its signals off screen with it — once someone has
 * stopped a share, neither side should keep seeing traffic from it.
 */
export async function receivedSignals(
  userId: string,
  now: Date = new Date(),
): Promise<ReceivedSignal[]> {
  const since = new Date(now.getTime() - SIGNAL_WINDOW_DAYS * DAY_MS);

  return db
    .select({
      id: buddySignals.id,
      linkId: buddySignals.linkId,
      kind: buddySignals.kind,
      createdAt: buddySignals.createdAt,
    })
    .from(buddySignals)
    .innerJoin(buddyLinks, eq(buddyLinks.id, buddySignals.linkId))
    .where(
      and(
        isNull(buddyLinks.revokedAt),
        gte(buddySignals.createdAt, since),
        or(
          and(eq(buddyLinks.ownerUserId, userId), ne(buddySignals.kind, 'sos')),
          and(eq(buddyLinks.buddyUserId, userId), eq(buddySignals.kind, 'sos')),
        ),
      ),
    )
    .orderBy(desc(buddySignals.createdAt));
}
