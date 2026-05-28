import { getLogs } from './actions';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const result = await getLogs();
  const logs = result.success ? result.data ?? [] : [];

  // Calculate statistics
  const totalLogs = logs.length;
  const smokeFreeLog = logs.find((log: any) => log.cigarettes === 0);
  const smokeFreeDate = smokeFreeLog ? new Date(smokeFreeLog.ts) : null;
  const daysSmokeFree = smokeFreeDate 
    ? Math.floor((Date.now() - smokeFreeDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Your Journey
          </h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        {totalLogs === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start tracking your smoke-free journey. Add your first log to begin!
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Logs</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalLogs}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Smoke-Free</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {daysSmokeFree > 0 ? daysSmokeFree : 'In Progress'}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Latest Entry</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {logs[0]?.cigarettes === 0 ? 'Smoke-Free' : `${logs[0]?.cigarettes} cigs`}
                </div>
              </div>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Logs
                </h2>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View Dashboard
                </Link>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {logs.map((log: any) => {
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
                      <div className="flex-shrink-0 w-24 text-sm text-gray-500 dark:text-gray-400">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          </>
        )}
      </div>
    </div>
  );
}
