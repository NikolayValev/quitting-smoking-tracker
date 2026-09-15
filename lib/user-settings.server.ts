import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  DEFAULT_CIGARETTES_PER_PACK,
  DEFAULT_CURRENCY,
  EMPTY_SETTINGS,
  type UserSettings,
} from '@/lib/user-settings';

/**
 * Reads the stored settings, normalised so callers never handle a raw row.
 *
 * Separate from lib/user-settings because that module is imported by a client
 * component; `server-only` above makes importing this one from the browser a
 * build error rather than a silently bloated bundle.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const rows = await db
    .select({
      baselinePerDay: users.baselinePerDay,
      pricePerPack: users.pricePerPack,
      cigarettesPerPack: users.cigarettesPerPack,
      currency: users.currency,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return EMPTY_SETTINGS;

  return {
    baselinePerDay: row.baselinePerDay ?? null,
    // numeric comes back as a string from the driver, so that money does not
    // pass through a float on its way out of Postgres.
    pricePerPack: row.pricePerPack === null ? null : Number(row.pricePerPack),
    cigarettesPerPack: row.cigarettesPerPack ?? DEFAULT_CIGARETTES_PER_PACK,
    currency: row.currency ?? DEFAULT_CURRENCY,
  };
}
