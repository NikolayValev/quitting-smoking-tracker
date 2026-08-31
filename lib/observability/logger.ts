import { PostHog } from 'posthog-node';
import { ANALYTICS_TAGS } from '@/lib/analytics/tags';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;
  const key = process.env.POSTHOG_API_KEY;
  if (!key) return null;
  client = new PostHog(key, {
    host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
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
