import type { MotivationalQuote } from "@/lib/data/motivational-quotes"

/**
 * The day's quote, as a quiet pull-quote.
 *
 * It used to be a full-bleed gradient banner at the top of the screen, which
 * put the most decorative thing on the page above the only thing on it that
 * helps. Someone arriving mid-craving had to scroll past inspiration to reach
 * the breathing exercise. It now sits at the end and is sized like what it is:
 * a nice thing to read, not a tool.
 *
 * The quote is chosen by the server (see app/wellness/page.tsx) rather than in
 * an effect here — picking it on the client meant rendering the first quote,
 * then swapping it in after mount, which is the hydration mismatch the old
 * effect existed to paper over.
 */
export function MotivationalHero({ quote }: { quote: MotivationalQuote }) {
  return (
    <figure className="border-l-2 border-primary/30 pl-5">
      <blockquote className="text-lg font-medium tracking-tight text-balance sm:text-xl">
        {quote.quote}
      </blockquote>
      <figcaption className="mt-2 text-sm text-muted-foreground">{quote.author}</figcaption>
    </figure>
  )
}
