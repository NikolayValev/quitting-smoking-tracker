import type { MotivationalQuote } from "@/lib/data/motivational-quotes"

/**
 * Presentational. The quote is chosen by the server (see app/wellness/page.tsx)
 * rather than in an effect here — picking it on the client meant rendering the
 * first quote, then swapping it in after mount, which is the hydration mismatch
 * the old effect existed to paper over.
 */
export function MotivationalHero({ quote }: { quote: MotivationalQuote }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 md:p-12">
      <div className="relative z-10 max-w-3xl">
        <div className="space-y-4">
          <div className="inline-block px-4 py-1.5 bg-primary-foreground/20 rounded-full text-sm font-medium backdrop-blur-sm">
            Daily Motivation
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-balance leading-tight">{quote.quote}</h2>
          <p className="text-lg text-primary-foreground/80">— {quote.author}</p>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl -z-0" />
    </div>
  )
}
