import type { WellnessTip } from "@/lib/data/wellness-tips"
import { TipCategory } from "@/components/tip-category"

/**
 * Presentational. The tip is chosen by the server (see app/wellness/page.tsx)
 * rather than in an effect here — picking it on the client meant rendering the
 * first tip, then swapping it in after mount, which is the hydration mismatch
 * the old effect existed to paper over.
 */
export function DailyTip({ tip }: { tip: WellnessTip }) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground">Today&rsquo;s tip</h2>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h3 className="text-xl font-medium tracking-tight text-balance">{tip.title}</h3>
        <TipCategory category={tip.category} />
      </div>
      <p className="mt-2 max-w-[62ch] text-muted-foreground">{tip.description}</p>
    </section>
  )
}
