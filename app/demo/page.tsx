import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { JourneyView, type JourneyEntry } from '@/components/journey-view';

// This page derives "days smoke-free" from the current time. Without a
// revalidate window it is prerendered once at build time, which freezes that
// number at whatever it was when the build ran — it would then drift further
// from the truth every day until the next deploy. Regenerating hourly keeps the
// counter honest while still serving a cached page.
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

export default async function DemoPage() {
  const logs = await getDemoLogs();

  // The fixture is written oldest first; JourneyView takes the same order the
  // database returns, which is newest first.
  const entries: JourneyEntry[] = [...logs]
    .reverse()
    .map((log) => ({ id: log.id, ts: log.ts, cigarettes: log.cigarettes, note: log.note ?? null }));

  const peak = Math.max(...logs.map((l) => l.cigarettes));

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

      <JourneyView
        entries={entries}
        intro={`A sample journey from ${peak} a day down to none. Sign in to track your own.`}
      >
        <section className="mt-14 border-t border-border/60 pt-10">
          <h2 className="text-xl font-semibold tracking-tight">Start your own</h2>
          <p className="mt-2 max-w-[58ch] text-muted-foreground">
            Log a check-in a day, watch the line come down, and keep the streak.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/sign-up">Create an account</Link>
          </Button>
        </section>
      </JourneyView>
    </div>
  );
}
