import { BreathingExercise } from "@/components/breathing-exercise"
import { UrgeResistance } from "@/components/urge-resistance"
import { TipLibrary } from "@/components/tip-library"
import { RelaxationPreview } from "@/components/relaxation-preview"
import { DailyTip } from "@/components/daily-tip"
import { MotivationalHero } from "@/components/motivational-hero"
import type { WellnessTip } from "@/lib/data/wellness-tips"
import type { MotivationalQuote } from "@/lib/data/motivational-quotes"

/**
 * The wellness screen.
 *
 * Ordered by what someone needs when they open it, which is almost always
 * mid-craving: the fact that this ends, then something to do with the minutes,
 * then alternatives, then reading matter.
 *
 * The three tools used to be tabs, so two thirds of the help was hidden behind
 * a choice nobody in that state wants to make. They are all on the page now, in
 * priority order. The tip library is the one thing folded away — it is
 * reference, not rescue, and open it was two-thirds of the page.
 *
 * Separate from the route so it can be rendered from fixtures with nobody
 * signed in; this screen cannot be designed without being looked at.
 */
export function WellnessView({
  quote,
  tip,
}: {
  quote: MotivationalQuote
  tip: WellnessTip
}) {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* The most useful sentence on the screen, and previously buried in the
          tip library: a craving is survivable and short. */}
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          A craving passes in about five minutes.
        </h1>
        <p className="mt-4 max-w-[58ch] text-lg text-muted-foreground">
          Here is something to do with them.
        </p>
      </section>

      <div className="mt-10">
        <BreathingExercise />
      </div>

      <section className="mt-14">
        <h2 className="text-sm font-medium text-muted-foreground">Other ways through</h2>
        <div className="mt-4">
          <UrgeResistance />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-medium text-muted-foreground">Longer sessions</h2>
        <div className="mt-4">
          <RelaxationPreview />
        </div>
      </section>

      <section className="mt-14 border-t border-border/60 pt-10">
        <DailyTip tip={tip} />
      </section>

      <section className="mt-12">
        <MotivationalHero quote={quote} />
      </section>

      <section className="mt-12 border-t border-border/60 pt-8">
        {/* Closed by default: useful to browse, useless to wade through when a
            craving is the reason you opened the app. */}
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <span className="group-open:hidden">Read all the tips</span>
            <span className="hidden group-open:inline">Hide the tips</span>
          </summary>
          <div className="mt-6">
            <TipLibrary />
          </div>
        </details>
      </section>
    </main>
  )
}
