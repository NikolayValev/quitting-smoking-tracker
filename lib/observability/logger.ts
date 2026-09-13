import { PostHog } from 'posthog-node';
import { ANALYTICS_TAGS } from '@/lib/analytics/tags';

let client: PostHog | null = null;

/**
 * Resolves the capture credentials, preferring server-only values.
 *
 * Falls back to the `NEXT_PUBLIC_*` pair the browser already uses. A PostHog
 * project key is write-only — it can capture events and read nothing back —
 * which is why it is safe in a client bundle and equally fine here. Without
 * this fallback the server had no key at all in production and every log went
 * to console.error, which on Vercel means a short retention window and no
 * alerting (NIK-119).
 *
 * `POSTHOG_API_KEY` / `POSTHOG_HOST` stay first so a server-only key can be
 * swapped in later without touching call sites.
 *
 * Both env lookups are written out in full rather than built dynamically:
 * Next.js inlines `NEXT_PUBLIC_*` at build time by literal text match, and a
 * computed key would not be substituted.
 */
function resolveConfig(): { key: string; host: string } | null {
  const key = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  const host =
    process.env.POSTHOG_HOST ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    'https://us.i.posthog.com';

  return { key, host };
}

function getClient(): PostHog | null {
  if (client) return client;
  const config = resolveConfig();
  if (!config) return null;
  client = new PostHog(config.key, {
    host: config.host,
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

type LogContext = {
  userId?: string;
  clerkUserId?: string;
  [key: string]: unknown;
};

function distinctIdFrom(context: LogContext): string {
  return context.userId ?? context.clerkUserId ?? 'anonymous';
}

export function logError(event: string, error: unknown, context: LogContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const c = getClient();
  if (!c) {
    console.error(`[${event}]`, err, context);
    return;
  }
  // Tags last so a stray context key cannot silently untag a health event.
  c.captureException(err, distinctIdFrom(context), { event, ...context, ...ANALYTICS_TAGS });
}

export function logWarn(event: string, context: LogContext = {}): void {
  const c = getClient();
  if (!c) {
    console.warn(`[${event}]`, context);
    return;
  }
  c.capture({
    distinctId: distinctIdFrom(context),
    event: `warn.${event}`,
    properties: { ...context, ...ANALYTICS_TAGS },
  });
}
