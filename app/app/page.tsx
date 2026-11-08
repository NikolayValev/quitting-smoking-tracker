import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getLogs } from './actions';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { JourneyView } from '@/components/journey-view';
import { DailyLogDialog } from '@/components/daily-log-dialog';
import { CravingPatterns } from '@/components/craving-patterns';
import { getOrCreateUser } from '@/lib/auth/getOrCreateUser';
import { summariseCravings } from '@/lib/cravings';
import { recentCravings } from '@/lib/cravings.server';
import { logError } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const result = await getLogs();
  const logs = result.success ? result.data ?? [] : [];

  // Patterns are an extra. If they cannot be read, the journey still shows.
  const cravings = await getOrCreateUser()
    .then((userId) => recentCravings(userId))
    .catch((error) => {
      logError('get_cravings_failed', error);
      return [];
    });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="journey" />

      {logs.length === 0 ? (
        <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <div className="py-16">
            <h1 className="text-3xl font-semibold tracking-tight">No check-ins yet</h1>
            <p className="mt-3 max-w-[52ch] text-muted-foreground">
              Log a day and the chart starts here. One check-in is enough to begin.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/onboarding">Log your first day</Link>
            </Button>
          </div>
        </main>
      ) : (
        <JourneyView
          editable
          entries={logs}
          cravings={<CravingPatterns summary={summariseCravings(cravings)} />}
          intro="Every check-in you have logged, and the shape they make."
          action={
            <DailyLogDialog
              trigger={
                <Button className="shrink-0 gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  Log today
                </Button>
              }
            />
          }
        />
      )}
    </div>
  );
}
