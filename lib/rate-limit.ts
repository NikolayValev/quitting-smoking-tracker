import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { logError } from '@/lib/observability/logger';

export type RateLimitResult = {
  allowed: boolean;
  /** Requests consumed in the current window, including this one. */
  used: number;
  limit: number;
  /** When the current window expires and the budget resets. */
  resetAt: Date;
};

export const DEFAULT_LIMIT = 30;
export const DEFAULT_WINDOW_SECONDS = 60;

type Options = {
  limit?: number;
  windowSeconds?: number;
};

/**
 * Counts one request against `subject`'s budget and reports whether it is allowed.
 *
 * Fixed window rather than sliding: the whole thing is a single row per subject,
 * reused forever, so the table never grows with usage and needs no pruning. The
 * cost is that a caller straddling a window boundary can briefly get up to twice
 * the limit, which is far below anything that matters here.
 *
 * The upsert is what makes this safe under concurrency — ON CONFLICT DO UPDATE
 * takes a row lock, so two simultaneous requests are serialised rather than both
 * reading a stale count.
 */
export async function consumeRateLimit(subject: string, options: Options = {}): Promise<RateLimitResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
  const windowInterval = `${windowSeconds} seconds`;

  try {
    const rows = (await db.execute(sql`
      INSERT INTO rate_limits (subject, window_start, count)
      VALUES (${subject}, now(), 1)
      ON CONFLICT (subject) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < now() - ${windowInterval}::interval THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < now() - ${windowInterval}::interval THEN now()
          ELSE rate_limits.window_start
        END
      RETURNING count, window_start
    `)) as unknown as Array<{ count: number; window_start: Date | string }>;

    const row = rows?.[0];
    if (!row) {
      // No row back means the statement did something we do not understand.
      // Treat it the same as an outage rather than silently blocking writes.
      return failOpen(limit, windowSeconds);
    }

    const windowStart = row.window_start instanceof Date ? row.window_start : new Date(row.window_start);
    const used = Number(row.count);

    return {
      allowed: used <= limit,
      used,
      limit,
      resetAt: new Date(windowStart.getTime() + windowSeconds * 1000),
    };
  } catch (error) {
    // Fail open. At this scale, blocking somebody's real logging because the
    // limiter is broken is a worse outcome than briefly not rate limiting.
    logError('rate_limit_check_failed', error, { subject });
    return failOpen(limit, windowSeconds);
  }
}

function failOpen(limit: number, windowSeconds: number): RateLimitResult {
  return {
    allowed: true,
    used: 0,
    limit,
    resetAt: new Date(Date.now() + windowSeconds * 1000),
  };
}
