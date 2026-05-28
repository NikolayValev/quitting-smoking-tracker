import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';

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
  
  // Calculate statistics
  const totalLogs = logs.length;
  const smokeFreeDay = logs.find(log => log.cigarettes === 0);
  const smokeFreeDate = smokeFreeDay ? new Date(smokeFreeDay.ts) : null;
  const daysSmokeFree = smokeFreeDate 
    ? Math.floor((Date.now() - smokeFreeDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const lastLog = logs[logs.length - 1];
  const currentStatus = lastLog?.cigarettes === 0 ? 'Smoke-free' : 'Reducing';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Demo Mode
            </h1>
            <Link 
              href="/sign-in"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save My Progress
            </Link>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            This is a demo showcasing a typical quitting journey. Sign in to track your own progress!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {currentStatus}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Smoke-Free</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {daysSmokeFree > 0 ? daysSmokeFree : 'In Progress'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Logs</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalLogs}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Journey Timeline
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {logs.map((log, index) => {
              const date = new Date(log.ts);
              const isSmokeFree = log.cigarettes === 0;
              
              return (
                <div 
                  key={log.id}
                  className={`flex gap-4 p-4 rounded-lg transition ${
                    isSmokeFree 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex-shrink-0 w-20 text-sm text-gray-500 dark:text-gray-400">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${
                        isSmokeFree 
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {isSmokeFree ? '🎉 Smoke-Free!' : `${log.cigarettes} cigarettes`}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-blue-600 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to start your own journey?</h3>
          <p className="mb-4">
            Sign up now to track your progress, set goals, and celebrate milestones!
          </p>
          <Link 
            href="/sign-up"
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
