import { SCREENS } from "./screens"

/**
 * Requests every route once before the workers start.
 *
 * `next dev` compiles a route the first time it is asked for. With workers
 * racing a cold server, several of them wait on the same compile and the
 * slowest can exceed its timeout — which showed up as one screen failing per
 * run, a different one each time. Compiling them up front removes the race
 * rather than papering over it with retries.
 */
export default async function globalSetup() {
  const baseURL = "http://127.0.0.1:3210"

  await Promise.all(
    SCREENS.map(async ({ path }) => {
      try {
        await fetch(`${baseURL}${path}`)
      } catch {
        // The capture itself reports a genuinely unreachable server far more
        // clearly than a failure in here would.
      }
    }),
  )
}
