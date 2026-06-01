import { getLogs } from './actions';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Cigarette, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const result = await getLogs();
  const logs = result.success ? result.data ?? [] : [];

  const totalLogs = logs.length;
  const smokeFreeLog = logs.find((log: any) => log.cigarettes === 0);
  const smokeFreeDate = smokeFreeLog ? new Date(smokeFreeLog.ts) : null;
  const daysSmokeFree = smokeFreeDate
    ? Math.floor((Date.now() - smokeFreeDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentPage="journey" />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {totalLogs === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to start?</h2>
            <p className="text-muted-foreground mb-6">
              Create your first log to begin tracking your smoke-free journey.
            </p>
            <Button asChild size="lg">
              <Link href="/onboarding">Create your first log</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Your Journey</h1>
              <Button asChild size="sm">
                <Link href="/onboarding" className="flex items-center gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  Add log
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">{totalLogs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Days Smoke-Free
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">
                    {daysSmokeFree > 0 ? daysSmokeFree : '—'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Latest Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">
                    {logs[0]?.cigarettes === 0 ? (
                      <span className="text-primary">Free</span>
                    ) : (
                      `${logs[0]?.cigarettes}`
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Log History</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y max-h-[560px] overflow-y-auto">
                  {logs.map((log: any) => {
                    const date = new Date(log.ts);
                    const isSmokeFree = log.cigarettes === 0;

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 px-6 py-3"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isSmokeFree ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Cigarette className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {isSmokeFree ? 'Smoke-free' : `${log.cigarettes} cigarettes`}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isSmokeFree && (
                                <Badge variant="secondary" className="text-xs">
                                  Smoke-free
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                          {log.note && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
