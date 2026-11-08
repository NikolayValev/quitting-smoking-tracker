import { BreathingExercise } from "@/components/breathing-exercise"
import { UrgeResistance } from "@/components/urge-resistance"
import { TipLibrary } from "@/components/tip-library"
import { RelaxationPreview } from "@/components/relaxation-preview"
import { DailyTip } from "@/components/daily-tip"
import { MotivationalHero } from "@/components/motivational-hero"
import { QuitSupport } from "@/components/quit-support"
import type { WellnessTip } from "@/lib/data/wellness-tips"
import type { MotivationalQuote } from "@/lib/data/motivational-quotes"
import { tipsFor } from "@/lib/substance-content"
import { SUBSTANCE_COPY, tracked, type Quitting } from "@/lib/substances"

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
  openPlan,
  quitting = "cigarettes",
}: {
  quote: MotivationalQuote
  tip: WellnessTip
  /** Dev screens only: a craving plan to show already open. */
  openPlan?: string
  quitting?: Quitting
}) {
  const substances = tracked(quitting)
  const both = substances.length > 1
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* The most useful sentence on the screen, and previously buried in the
          tip library: a craving is survivable and short. */}
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {/* Five minutes is the nicotine figure. Cannabis cravings are not
              timed that precisely, so that headline says only what is known. */}
          {quitting === "cigarettes"
            ? "A craving passes in about five minutes."
            : "A craving rises, peaks and passes."}
        </h1>
        <p className="mt-4 max-w-[58ch] text-lg text-muted-foreground">
          Here is something to do with them.
        </p>
      </section>

      <div className="mt-10">
        <BreathingExercise />
      </div>

      <section className="mt-14">
        <h2 className="text-sm font-medium text-muted-foreground">When does it usually hit?</h2>
        {substances.map((substance) => (
          <div key={substance} className="mt-4">
            {both && (
              <h3 className="mb-3 mt-8 text-base font-medium tracking-tight first:mt-0">
                {SUBSTANCE_COPY[substance].name}
              </h3>
            )}
            <UrgeResistance substance={substance} initialStrategy={openPlan} />
          </div>
        ))}
      </section>

      {substances.map((substance) => (
        <div key={substance} className="mt-14">
          <QuitSupport substance={substance} named={both} />
        </div>
      ))}

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
            <TipLibrary tips={tipsFor(quitting)} />
          </div>
        </details>
      </section>
    </main>
  )
}
