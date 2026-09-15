import type { StatsSettings } from '@/lib/dashboard-stats';

/**
 * Pure. No database import lives in this file on purpose: the settings form is
 * a client component and imports formatMoney from here, and one `db` import
 * anywhere in that graph pulls the Postgres driver into the browser bundle —
 * which is exactly how the build broke. The query lives in
 * lib/user-settings.server.ts.
 */

export const DEFAULT_CIGARETTES_PER_PACK = 20;
export const DEFAULT_CURRENCY = 'USD';

export type UserSettings = {
  baselinePerDay: number | null;
  pricePerPack: number | null;
  cigarettesPerPack: number;
  currency: string;
};

export const EMPTY_SETTINGS: UserSettings = {
  baselinePerDay: null,
  pricePerPack: null,
  cigarettesPerPack: DEFAULT_CIGARETTES_PER_PACK,
  currency: DEFAULT_CURRENCY,
};

/**
 * Price of one cigarette, or null when we have not been told enough to say.
 *
 * Returning null rather than a guess is the point: the caller falls back to a
 * documented default and can say so, instead of presenting an invented number
 * as though it were the person's own.
 */
export function pricePerCigarette(settings: UserSettings): number | null {
  const { pricePerPack, cigarettesPerPack } = settings;
  if (!pricePerPack || pricePerPack <= 0) return null;
  if (!cigarettesPerPack || cigarettesPerPack <= 0) return null;
  return pricePerPack / cigarettesPerPack;
}

/** The shape deriveDashboardStats wants. */
export function toStatsSettings(settings: UserSettings): StatsSettings {
  return {
    baselinePerDay: settings.baselinePerDay,
    pricePerCigarette: pricePerCigarette(settings),
  };
}

/**
 * Money in the user's own currency.
 *
 * Intl rather than a literal "$": the app was quoting dollars to everybody,
 * which is wrong for most of the world and quietly wrong for anyone who read it
 * as their own currency. An unrecognised code falls back rather than throwing —
 * a bad setting should not take the dashboard down.
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
