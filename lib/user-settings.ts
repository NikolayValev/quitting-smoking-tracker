import type { StatsSettings } from '@/lib/dashboard-stats';
import type { Quitting, Substance } from '@/lib/substances';

/**
 * Pure. No database import lives in this file on purpose: the settings form is
 * a client component and imports formatMoney from here, and one `db` import
 * anywhere in that graph pulls the Postgres driver into the browser bundle —
 * which is exactly how the build broke. The query lives in
 * lib/user-settings.server.ts.
 */

export const DEFAULT_CIGARETTES_PER_PACK = 20;
export const DEFAULT_CURRENCY = 'USD';

/**
 * Cannabis use before quitting, assumed when nothing is stated or logged. Once
 * a day is the low end for anyone using daily, so savings are understated
 * rather than invented, and the dashboard says what they were reckoned at.
 */
export const ASSUMED_SESSIONS_PER_DAY = 1;

export type UserSettings = {
  quitting: Quitting;
  /** Cigarettes a day before quitting. */
  baselinePerDay: number | null;
  pricePerPack: number | null;
  cigarettesPerPack: number;
  /** Times a day cannabis was used before quitting. */
  sessionsPerDay: number | null;
  pricePerSession: number | null;
  currency: string;
};

export const EMPTY_SETTINGS: UserSettings = {
  quitting: 'cigarettes',
  baselinePerDay: null,
  pricePerPack: null,
  cigarettesPerPack: DEFAULT_CIGARETTES_PER_PACK,
  sessionsPerDay: null,
  pricePerSession: null,
  currency: DEFAULT_CURRENCY,
};

/**
 * Price of one cigarette, or null when we have not been told enough to say.
 *
 * Returning null rather than a guess is the point: the caller falls back to a
 * documented default and can say so, instead of presenting an invented number
 * as though it were the person's own.
 */
export function pricePerCigarette(
  settings: Pick<UserSettings, 'pricePerPack' | 'cigarettesPerPack'>,
): number | null {
  const { pricePerPack, cigarettesPerPack } = settings;
  if (!pricePerPack || pricePerPack <= 0) return null;
  if (!cigarettesPerPack || cigarettesPerPack <= 0) return null;
  return pricePerPack / cigarettesPerPack;
}

/** The shape deriveDashboardStats wants, for one substance. */
export function toStatsSettings(
  settings: UserSettings,
  substance: Substance = 'cigarettes',
): StatsSettings {
  if (substance === 'cannabis') {
    return {
      baselinePerDay: settings.sessionsPerDay,
      pricePerUnit: settings.pricePerSession,
      assumedPerDay: ASSUMED_SESSIONS_PER_DAY,
      // No guessed price: the dashboard asks for one instead.
      fallbackPrice: null,
    };
  }
  return {
    baselinePerDay: settings.baselinePerDay,
    pricePerUnit: pricePerCigarette(settings),
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
