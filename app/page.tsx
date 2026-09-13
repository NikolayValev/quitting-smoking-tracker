import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { BarChart2, Wind, Lightbulb } from "lucide-react"

const features = [
  {
    icon: BarChart2,
    title: "See the line come down",
    body: "Log what you smoke and watch the count fall. Milestones from twenty minutes to ten years mark themselves off as you pass them.",
  },
  {
    icon: Wind,
    title: "Something to do at 3pm",
    body: "A 4-4-6-2 breathing exercise and step-by-step urge guides, for the moments a craving arrives and willpower alone is thin.",
  },
  {
    icon: Lightbulb,
    title: "A reason to come back",
    body: "A rotating library of advice on health, motivation and the ordinary practicalities of not smoking.",
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
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Quitting is a lot of small days.
            <span className="block text-muted-foreground">This counts them.</span>
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg text-muted-foreground">
            Log a check-in a day, get something to do when a craving hits, and keep a
            streak worth protecting.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">Create an account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">See a sample journey</Link>
            </Button>
          </div>
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
