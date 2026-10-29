import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { CalendarClock, Coffee, HeartHandshake, PiggyBank } from "lucide-react"

/**
 * Each feature names something specific to cigarettes. The earlier copy ("A
 * reason to come back", "advice on health and motivation") could have been on
 * any wellness app, which is what made the page read as generic.
 */
const features = [
  {
    icon: CalendarClock,
    title: "Know what day three feels like",
    body: "Withdrawal peaks in the first three days and fades over about a month. The dashboard tells you what is normal for the day you are on, so a bad afternoon reads as expected rather than as failure.",
  },
  {
    icon: Coffee,
    title: "A plan for the cigarettes you never think about",
    body: "The first one of the morning, the one with coffee, after meals, in the car, with a drink. Each gets a short, specific plan, and a breathing timer for when it hits anyway.",
  },
  {
    icon: PiggyBank,
    title: "What the packs were costing you",
    body: "Set your pack price in your own currency and watch what you keep add up. Health milestones, from twenty minutes to ten years, mark themselves off.",
  },
  {
    icon: HeartHandshake,
    title: "Someone in your corner",
    body: "Invite a buddy to follow your streak, or a sponsor who sees when you slip and is the one you reach with a single tap when it gets hard.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/demo">See a demo</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Left-aligned rather than a centred stack: the page reads as a
            document with a spine, and it is the same shape on a phone. */}
        <section className="mx-auto max-w-3xl py-20 sm:py-28">
          <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-medium text-foreground">
              For quitting cigarettes
            </span>
            <span className="rounded-full border border-dashed border-border px-3 py-1">
              Marijuana — coming soon
            </span>
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Quitting cigarettes is a lot of small days.
            <span className="block text-muted-foreground">This counts them.</span>
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg text-muted-foreground">
            Log a check-in a day, know what withdrawal will feel like before it arrives,
            and have a plan for the coffee, the car and the drink after work.
          </p>
          {/* The sample journey leads. Most people arriving here are looking
              rather than quitting, and it is the screen worth showing them —
              a real ninety-day history, no account required. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/demo">See a sample journey</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-up">Create an account</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            No account needed to look around.
          </p>
        </section>

        {/* Rules rather than cards. Three identical boxes would say these are
            three products; they are three parts of one. */}
        <section className="mx-auto max-w-3xl border-t border-border/60 pb-24">
          <ul>
            {features.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-5 border-b border-border/60 py-8 last:border-b-0"
              >
                <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h2 className="text-lg font-medium tracking-tight">{title}</h2>
                  <p className="mt-2 max-w-[62ch] text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} SmokeFree</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
