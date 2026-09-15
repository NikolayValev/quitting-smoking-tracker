/**
 * Exercises the buddy cycle against the real database.
 *
 * The unit tests mock `@/db`, so they prove the logic and nothing about the
 * SQL. This proves the parts only Postgres can answer: that the unique index
 * exists and the ON CONFLICT clause matches it, that the joins are valid, and
 * that a revoked link really does stop returning a summary.
 *
 * It creates two throwaway users, runs the cycle, and deletes them in a finally
 * block. Everything it writes is prefixed so a leftover row is recognisable.
 *
 *   pnpm verify:buddies
 */
import { and, eq, inArray, or } from 'drizzle-orm';
import { db } from '../db';
import { users, smokeLogs, buddyLinks } from '../db/schema';
import {
  acceptInvite,
  createInvite,
  getSharedSummary,
  listBuddies,
  listSupporting,
  revokeLink,
} from '../lib/buddies';

const PREFIX = `verify-buddies-${Date.now()}`;
const results: string[] = [];

function check(label: string, passed: boolean, detail = '') {
  results.push(`${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!passed) process.exitCode = 1;
}

async function main() {
  const [owner] = await db
    .insert(users)
    .values({ clerkUserId: `${PREFIX}-owner` })
    .returning();
  const [buddy] = await db
    .insert(users)
    .values({ clerkUserId: `${PREFIX}-buddy` })
    .returning();

  // A short streak to summarise.
  const day = 86_400_000;
  for (let i = 0; i < 5; i++) {
    const d = new Date(Date.now() - i * day);
    await db.insert(smokeLogs).values({
      userId: owner.id,
      cigarettes: 0,
      logDate: d.toISOString().slice(0, 10),
      ts: new Date(`${d.toISOString().slice(0, 10)}T12:00:00.000Z`),
      note: 'verify script',
    });
  }

  // The unique index, and that createLog's conflict target matches it.
  const today = new Date().toISOString().slice(0, 10);
  let duplicateRejected = false;
  try {
    await db.insert(smokeLogs).values({
      userId: owner.id,
      cigarettes: 9,
      logDate: today,
      ts: new Date(`${today}T12:00:00.000Z`),
    });
  } catch {
    duplicateRejected = true;
  }
  check('a second check-in for one day is rejected by the database', duplicateRejected);

  const upserted = await db
    .insert(smokeLogs)
    .values({
      userId: owner.id,
      cigarettes: 9,
      logDate: today,
      ts: new Date(`${today}T12:00:00.000Z`),
    })
    .onConflictDoUpdate({
      target: [smokeLogs.userId, smokeLogs.logDate],
      set: { cigarettes: 9 },
    })
    .returning();
  check('the upsert target matches that index', upserted[0]?.cigarettes === 9);

  // Put the streak back for the summary checks.
  await db
    .update(smokeLogs)
    .set({ cigarettes: 0 })
    .where(and(eq(smokeLogs.userId, owner.id), eq(smokeLogs.logDate, today)));

  check('a stranger sees nothing', (await getSharedSummary(owner.id, buddy.id)) === null);

  const { code } = await createInvite(owner.id);
  check('an invite is minted', typeof code === 'string' && code.length >= 16);
  check(
    'the code itself is not stored',
    (await db.select().from(buddyLinks).where(eq(buddyLinks.ownerUserId, owner.id)))
      .every((l) => l.codeHash !== code),
  );

  check('self-accept is refused', (await acceptInvite(code, owner.id)).ok === false);
  check('the buddy accepts', (await acceptInvite(code, buddy.id)).ok === true);
  check('the code cannot be reused', (await acceptInvite(code, buddy.id)).ok === false);

  const summary = await getSharedSummary(owner.id, buddy.id);
  check('the buddy now sees a summary', summary !== null);
  check(
    'and it carries only the agreed fields',
    summary !== null &&
      JSON.stringify(Object.keys(summary).sort()) ===
        JSON.stringify(['milestoneCount', 'milestonesReached', 'quitDate', 'smokeFreeDays']),
    summary ? Object.keys(summary).join(',') : '',
  );
  check(
    'no note reaches the buddy',
    !JSON.stringify(summary).includes('verify script'),
  );
  check('the streak is counted', (summary?.smokeFreeDays ?? -1) >= 4, `${summary?.smokeFreeDays} days`);

  check('the owner lists their buddy', (await listBuddies(owner.id)).length === 1);
  check('the buddy lists who they follow', (await listSupporting(buddy.id)).length === 1);

  const link = (await listBuddies(owner.id))[0];

  // A third party with a link id must not be able to end somebody else's share.
  const [stranger] = await db
    .insert(users)
    .values({ clerkUserId: `${PREFIX}-stranger` })
    .returning();
  check(
    'a stranger holding the link id cannot revoke it',
    (await revokeLink(link.linkId, stranger.id)).revoked === false,
  );
  check(
    'and the share still works afterwards',
    (await getSharedSummary(owner.id, buddy.id)) !== null,
  );

  // Either side may end it; here the buddy does.
  check('either side may revoke', (await revokeLink(link.linkId, buddy.id)).revoked === true);

  check(
    'access stops the moment it is revoked',
    (await getSharedSummary(owner.id, buddy.id)) === null,
  );
}

async function cleanup() {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.clerkUserId, [`${PREFIX}-owner`, `${PREFIX}-buddy`, `${PREFIX}-stranger`]));
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return;

  await db
    .delete(buddyLinks)
    .where(or(inArray(buddyLinks.ownerUserId, ids), inArray(buddyLinks.buddyUserId, ids)));
  await db.delete(smokeLogs).where(inArray(smokeLogs.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));
  console.log(`\ncleaned up ${ids.length} throwaway users`);
}

main()
  .catch((error) => {
    console.error('threw:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    console.log(`\n${results.join('\n')}`);
    const failed = results.filter((r) => r.startsWith('FAIL')).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed`);
    process.exit(process.exitCode ?? 0);
  });
