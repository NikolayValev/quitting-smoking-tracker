import { withdrawalPhase } from "@/lib/withdrawal"

/**
 * What today of a quit usually feels like, under the streak.
 *
 * Quiet on purpose: it is context for the number above it, not a second
 * headline. Its job is to make a hard day read as expected rather than as
 * failure.
 */
export function WithdrawalNote({ smokeFreeDays }: { smokeFreeDays: number }) {
  const phase = withdrawalPhase(smokeFreeDays)

  return (
    <section className="mt-8 border-l-2 border-primary/40 pl-4" aria-label="What to expect">
      <h2 className="text-sm font-medium">{phase.title}</h2>
      <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{phase.body}</p>
    </section>
  )
}
