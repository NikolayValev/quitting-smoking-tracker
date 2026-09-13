import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PostHog } from 'posthog-node';

const captureException = vi.fn();
const capture = vi.fn();

vi.mock('posthog-node', () => ({
  PostHog: vi.fn(),
}));

describe('lib/observability/logger', () => {
  const originalKey = process.env.POSTHOG_API_KEY;
  const originalHost = process.env.POSTHOG_HOST;
  const originalPublicKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const originalPublicHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  beforeEach(() => {
    vi.resetModules();
    // Every test declares the key state it wants; start from none so a value
    // leaking in from the real environment cannot mask a regression.
    delete process.env.POSTHOG_API_KEY;
    delete process.env.POSTHOG_HOST;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    captureException.mockClear();
    capture.mockClear();
    // vi.restoreAllMocks() in afterEach also restores plain vi.fn() mocks (not just
    // vi.spyOn spies), wiping this mockImplementation after the first test. Re-set it
    // every test rather than only once in the vi.mock factory above.
    vi.mocked(PostHog).mockImplementation(
      () => ({ captureException, capture }) as unknown as PostHog
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.POSTHOG_API_KEY = originalKey;
    process.env.POSTHOG_HOST = originalHost;
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalPublicKey;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = originalPublicHost;
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

  it('falls back to console.error when no PostHog key is configured at all', async () => {
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

  it('uses the shared NEXT_PUBLIC_POSTHOG_KEY when no server-only key is set', async () => {
    // The project key is capture-only, so the same one the browser uses is a
    // legitimate server credential — it cannot read anything back out.
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_shared';
    const { logError } = await import('@/lib/observability/logger');

    logError('create_log_failed', new Error('boom'), { userId: 'user-123' });

    expect(vi.mocked(PostHog).mock.calls[0][0]).toBe('phc_shared');
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('prefers a server-only POSTHOG_API_KEY over the shared one', async () => {
    process.env.POSTHOG_API_KEY = 'phc_server_only';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_shared';
    const { logError } = await import('@/lib/observability/logger');

    logError('create_log_failed', new Error('boom'));

    expect(vi.mocked(PostHog).mock.calls[0][0]).toBe('phc_server_only');
  });

  it('takes the host from NEXT_PUBLIC_POSTHOG_HOST when no server host is set', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_shared';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com';
    const { logError } = await import('@/lib/observability/logger');

    logError('create_log_failed', new Error('boom'));

    expect(vi.mocked(PostHog).mock.calls[0][1]).toMatchObject({
      host: 'https://eu.i.posthog.com',
    });
  });

  it('prefers a server-only POSTHOG_HOST over the shared one', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_shared';
    process.env.POSTHOG_HOST = 'https://self-hosted.example.com';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com';
    const { logError } = await import('@/lib/observability/logger');

    logError('create_log_failed', new Error('boom'));

    expect(vi.mocked(PostHog).mock.calls[0][1]).toMatchObject({
      host: 'https://self-hosted.example.com',
    });
  });

  it('defaults to US cloud when a key is set but no host is', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_shared';
    const { logError } = await import('@/lib/observability/logger');

    logError('create_log_failed', new Error('boom'));

    expect(vi.mocked(PostHog).mock.calls[0][1]).toMatchObject({
      host: 'https://us.i.posthog.com',
    });
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
