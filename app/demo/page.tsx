import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Cigarette } from 'lucide-react';

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

  const totalLogs = logs.length;
  const smokeFreeDay = logs.find(log => log.cigarettes === 0);
  const smokeFreeDate = smokeFreeDay ? new Date(smokeFreeDay.ts) : null;
  const daysSmokeFree = smokeFreeDate
    ? Math.floor((Date.now() - smokeFreeDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const lastLog = logs[logs.length - 1];
  const currentStatus = lastLog?.cigarettes === 0 ? 'Smoke-free' : 'Reducing';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">
            Smoke<span className="text-primary">Free</span>
            <Badge variant="secondary" className="ml-2 text-xs">Demo</Badge>
          </span>
          <Button asChild size="sm">
            <Link href="/sign-in">Save My Progress</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demo Journey</h1>
          <p className="text-muted-foreground mt-1">
            A sample quitting journey. Sign in to track your own progress.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-primary">{currentStatus}</div>
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
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{totalLogs}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Journey Timeline</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y max-h-[560px] overflow-y-auto">
              {logs.map((log) => {
                const date = new Date(log.ts);
                const isSmokeFree = log.cigarettes === 0;

                return (
                  <div key={log.id} className="flex items-start gap-3 px-6 py-3">
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
                            <Badge variant="secondary" className="text-xs">Smoke-free</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {log.note && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{log.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="text-center space-y-3 py-4">
          <h3 className="text-lg font-semibold">Ready to start your own journey?</h3>
          <p className="text-sm text-muted-foreground">
            Sign up to track your progress, set goals, and celebrate milestones.
          </p>
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
