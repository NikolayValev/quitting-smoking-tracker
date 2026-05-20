import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

function createRatelimit(requests: number, window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  })
}

export const authRatelimit = createRatelimit(10, "1 m")
