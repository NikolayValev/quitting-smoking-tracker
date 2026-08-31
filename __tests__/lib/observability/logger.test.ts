import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const captureException = vi.fn();
const capture = vi.fn();

vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    captureException,
    capture,
  })),
}));

describe('lib/observability/logger', () => {
  const originalKey = process.env.POSTHOG_API_KEY;
  const originalHost = process.env.POSTHOG_HOST;

  beforeEach(() => {
    vi.resetModules();
    captureException.mockClear();
    capture.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.POSTHOG_API_KEY = originalKey;
    process.env.POSTHOG_HOST = originalHost;
    vi.restoreAllMocks();
  });

  it('forwards to PostHog captureException with event + context when POSTHOG_API_KEY is set', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    const { logError } = await import('@/lib/observability/logger');

    const err = new Error('boom');
    logError('create_log_failed', err, { userId: 'user-123', route: '/app' });

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(err, 'user-123', {
      event: 'create_log_failed',
      userId: 'user-123',
      route: '/app',
      // Every event carries these so this app's data stays identifiable inside
      // the PostHog project it shares with the other portfolio apps.
      app: 'quitting-smoking-tracker',
      data_class: 'health',
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('falls back to console.error when POSTHOG_API_KEY is unset', async () => {
    delete process.env.POSTHOG_API_KEY;
    const { logError } = await import('@/lib/observability/logger');

    const err = new Error('boom');
    logError('create_log_failed', err, { userId: 'user-123' });

    expect(captureException).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[create_log_failed]',
      err,
      { userId: 'user-123' }
    );
  });

  it('coerces non-Error values into Error before capturing', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    const { logError } = await import('@/lib/observability/logger');

    logError('weird_failure', 'a string was thrown', { userId: 'user-1' });

    expect(captureException).toHaveBeenCalledTimes(1);
    const [passedErr, distinctId] = captureException.mock.calls[0];
    expect(passedErr).toBeInstanceOf(Error);
    expect((passedErr as Error).message).toBe('a string was thrown');
    expect(distinctId).toBe('user-1');
  });

  it('uses clerkUserId as distinctId when userId is absent', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    const { logError } = await import('@/lib/observability/logger');

    logError('account_delete_failed', new Error('nope'), { clerkUserId: 'user_ABC' });

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      'user_ABC',
      expect.objectContaining({ event: 'account_delete_failed', clerkUserId: 'user_ABC' })
    );
  });

  it('falls back to anonymous distinctId when neither id is present', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    const { logError } = await import('@/lib/observability/logger');

    logError('some_event', new Error('nope'));

    expect(captureException.mock.calls[0][1]).toBe('anonymous');
  });

  it('logWarn forwards to PostHog capture with warn.-prefixed event', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test';
    const { logWarn } = await import('@/lib/observability/logger');

    logWarn('rate_limited', { userId: 'user-9', ip: '1.2.3.4' });

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      distinctId: 'user-9',
      event: 'warn.rate_limited',
      properties: {
        userId: 'user-9',
        ip: '1.2.3.4',
        app: 'quitting-smoking-tracker',
        data_class: 'health',
      },
    });
  });

  it('logWarn falls back to console.warn when POSTHOG_API_KEY is unset', async () => {
    delete process.env.POSTHOG_API_KEY;
    const { logWarn } = await import('@/lib/observability/logger');

    logWarn('rate_limited', { userId: 'user-9' });

    expect(capture).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[rate_limited]', { userId: 'user-9' });
  });
});
