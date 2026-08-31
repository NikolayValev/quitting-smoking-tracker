import posthog from "posthog-js"

/**
 * PostHog wiring for the quit tracker.
 *
 * All four portfolio apps report into one shared PostHog project, so every
 * event is tagged with `app`. This app is the only one handling health data, so
 * it additionally tags `data_class: "health"` — that is what makes its events
 * findable for retention, access or deletion policy inside a project it shares
 * with two games and a landing page.
 *
 * The privacy posture is enforced in SDK config below rather than left to
 * discipline at call sites.
 */
const APP_NAME = "quitting-smoking-tracker"

let enabled = false

/** Coarse buckets. The exact count is deliberately never sent: per-person daily
 *  cigarette counts reconstruct a person's smoking habit in fine detail, which
 *  is not something this app needs in analytics to answer product questions. */
export type CigaretteBucket = "0" | "1-5" | "6-10" | "11-20" | "21+"

export function bucketCigarettes(count: number): CigaretteBucket {
  if (count <= 0) return "0"
  if (count <= 5) return "1-5"
  if (count <= 10) return "6-10"
  if (count <= 20) return "11-20"
  return "21+"
}

function stripQuery(value: unknown): unknown {
  return typeof value === "string" ? value.split("?")[0] : value
}

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return // Unconfigured environment — run untracked.

  posthog.init(key, {
    // Same-origin proxy (see next.config.mjs) so ad blockers do not drop events.
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",

    // Autocapture records the text of clicked elements. In an app whose UI
    // renders a person's own log entries and notes, that would exfiltrate
    // exactly the content this app must never send. Everything meaningful is
    // captured explicitly below instead.
    autocapture: false,

    // Session recording replays the screen, notes and all.
    disable_session_recording: true,

    // URLs can carry identifiers in the query string; keep only the path.
    sanitize_properties: (properties) => ({
      ...properties,
      $current_url: stripQuery(properties.$current_url),
      $referrer: stripQuery(properties.$referrer),
    }),
  })

  posthog.register({ app: APP_NAME, data_class: "health" })
  enabled = true
}

export function isEnabled(): boolean {
  return enabled
}

/**
 * Identify against the Clerk user id and nothing else.
 *
 * Deliberately no email, name or profile property: attaching an email address
 * to health events, in a PostHog project shared with unrelated apps, is the
 * specific outcome worth avoiding.
 */
export function identifyUser(userId: string): void {
  if (!enabled) return
  posthog.identify(userId)
}

export function resetUser(): void {
  if (!enabled) return
  posthog.reset()
}

/** A daily log. Splits into streak vs relapse; never carries the note text. */
export function captureDailyLog(cigarettes: number, hasNote: boolean): void {
  if (!enabled) return
  posthog.capture(cigarettes === 0 ? "streak_day_logged" : "relapse_logged", {
    cigarettes_bucket: bucketCigarettes(cigarettes),
    // Whether a note was written, never what it said.
    note_included: hasNote,
  })
}

/** Reaching for a coping strategy. `strategy` is an app-defined id, not user text. */
export function captureCraving(strategy: string): void {
  if (!enabled) return
  posthog.capture("craving_logged", { strategy })
}

/**
 * Milestones are derived from the quit date on every render, so they would
 * re-fire on every page load. Deduped per browser so the event means "reached
 * this milestone" rather than "rendered the milestones page again".
 */
export function captureMilestoneOnce(milestone: string): void {
  if (!enabled) return
  const storageKey = `qst:ph:milestone:${milestone}`
  try {
    if (localStorage.getItem(storageKey)) return
    localStorage.setItem(storageKey, "1")
  } catch {
    // Private mode or blocked storage — skip rather than risk duplicate events.
    return
  }
  posthog.capture("milestone_reached", { milestone })
}
