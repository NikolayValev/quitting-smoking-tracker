import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { JourneyChart, type JourneyPoint } from '@/components/journey-chart';
import { CheckCircle2 } from 'lucide-react';

// This page derives "days smoke-free" from Date.now(). Without a revalidate
// window it is prerendered once at build time, which freezes that number at
// whatever it was when the build ran — it would then drift further from the
// truth every day until the next deploy. Regenerating hourly keeps the counter
// honest while still serving a cached page.
export const revalidate = 3600;

type DemoLog = {
  id: string;
  ts: string;
  cigarettes: number;
  note?: string;
};

async function getDemoLogs(): Promise<DemoLog[]> {
  const filePath = path.join(process.cwd(), 'data', 'demoLogs.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

const shortDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const longDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function DemoPage() {
  const logs = await getDemoLogs();

  const firstCleanIndex = logs.findIndex((log) => log.cigarettes === 0);
  const smokeFreeDate = firstCleanIndex >= 0 ? new Date(logs[firstCleanIndex].ts) : null;
  const daysSmokeFree = smokeFreeDate
    ? Math.floor((Date.now() - smokeFreeDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const startDate = new Date(logs[0].ts);
  const peak = Math.max(...logs.map((l) => l.cigarettes));

  const chartData: JourneyPoint[] = logs.map((log) => ({
    t: new Date(log.ts).getTime(),
    cigarettes: log.cigarettes,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge variant="secondary" className="font-normal">Demo</Badge>
          </div>
          <Button asChild size="sm">
            <Link href="/sign-in">Save my progress</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* The streak is the headline. It is the one fact someone quitting
            actually wants, so it is the largest thing on the page rather than
            one of three equally weighted tiles. */}
        <section>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            {daysSmokeFree > 0 ? daysSmokeFree.toLocaleString('en-GB') : '—'}
            <span className="ml-3 align-baseline text-xl font-normal text-muted-foreground sm:text-2xl">
              days smoke-free
            </span>
          </h1>
          <p className="mt-4 max-w-[58ch] text-base text-muted-foreground">
            A sample journey from {peak} a day down to none. Sign in to track your own.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground">Cigarettes a day</h2>
          <div className="mt-3">
            <JourneyChart data={chartData} quitAt={smokeFreeDate ? smokeFreeDate.getTime() : null} />
          </div>
        </section>

        {/* Quiet supporting facts. Deliberately not cards: giving these the same
            frame as the streak above would say they matter as much. */}
        <section className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border/60 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Started</dt>
            <dd className="mt-1 text-base font-medium">{longDate(startDate)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Check-ins</dt>
            <dd className="mt-1 text-base font-medium">{logs.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Quit day</dt>
            <dd className="mt-1 text-base font-medium">
              {smokeFreeDate ? longDate(smokeFreeDate) : 'Not yet'}
            </dd>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium text-muted-foreground">Check-ins</h2>

          {/* A continuous spine rather than a fixed-height scroller. The old
              card capped this at 560px and produced a second scrollbar inside
              the page, which is awkward on a phone and hid most of the story. */}
          <ol className="mt-4">
            {logs.map((log, i) => {
              const date = new Date(log.ts);
              const isClean = log.cigarettes === 0;
              const isQuitDay = i === firstCleanIndex;
              const isLast = i === logs.length - 1;

              return (
                <li key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[7px] top-5 h-full w-px bg-border"
                    />
                  )}

                  <span
                    aria-hidden
                    className={
                      isClean
                        ? 'relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background'
                        : 'relative mt-2 ml-[3px] h-2 w-2 shrink-0 rounded-full bg-border'
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-medium">
                        {isClean ? 'Smoke-free' : `${log.cigarettes} cigarettes`}
                      </span>
                      <time
                        dateTime={log.ts}
                        className="text-xs tabular-nums text-muted-foreground"
                      >
                        {shortDate(date)}
                      </time>
                      {isQuitDay && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          Quit day
                        </span>
                      )}
                    </div>
                    {log.note && (
                      <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
                        {log.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mt-14 border-t border-border/60 pt-10">
          <h2 className="text-xl font-semibold tracking-tight">Start your own</h2>
          <p className="mt-2 max-w-[58ch] text-muted-foreground">
            Log a check-in a day, watch the line come down, and keep the streak.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/sign-up">Create an account</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
