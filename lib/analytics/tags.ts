/**
 * Tags applied to every event this app sends to PostHog, client or server.
 *
 * All four portfolio apps share one PostHog project, so `app` is what separates
 * this app's events from the games' and the landing page's. `data_class` marks
 * this app's events as health data, which is what makes them findable for
 * retention, access or deletion policy inside that shared project.
 *
 * Kept in its own module with no SDK import so both the browser (posthog-js)
 * and the server (posthog-node) can use the same values.
 */
export const ANALYTICS_APP = "quitting-smoking-tracker"
export const ANALYTICS_DATA_CLASS = "health"

/** Spread into server-side event properties. The browser registers these as
 *  super-properties instead, which posthog-node has no equivalent for. */
export const ANALYTICS_TAGS = {
  app: ANALYTICS_APP,
  data_class: ANALYTICS_DATA_CLASS,
} as const
