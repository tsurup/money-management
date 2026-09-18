import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import { getBalance, getLogs, getMonthlySummary } from '@/lib/actions/logs'
import { getActions } from '@/lib/actions/action-items'
import QuickLog from '@/components/QuickLog'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const [balanceRes, logsRes, actionsRes, summaryRes] = await Promise.all([
    getBalance(),
    getLogs(),
    getActions(),
    getMonthlySummary(now.getFullYear(), now.getMonth() + 1),
  ])

  const balance = balanceRes.data ?? 0
  const recentLogs = logsRes.data?.slice(0, 5) ?? []
  const actions = actionsRes.data ?? []
  const summary = summaryRes.data ?? { saved: 0, spent: 0 }

  return (
    <div className="flex min-h-screen">
      <Navbar username={session.username} />
      <main className="flex-1 pt-14 pb-16 md:pt-0 md:pb-0 md:ml-56 p-4 md:p-8">
        <div className="space-y-8 animate-fade-in-up max-w-3xl">
          <div>
            <h1 className="text-3xl font-bold text-white">ダッシュボード</h1>
            <p className="text-gray-500 mt-1">こんにちは、{session.username} さん</p>
          </div>

          <div className="card animate-pulse-glow bg-gradient-to-br from-violet-900/40 to-gray-900 border-violet-500/30">
            <p className="text-gray-400 text-sm font-medium">現在の残高</p>
            <p className={`text-5xl font-bold mt-2 ${balance >= 0 ? 'text-violet-300' : 'text-red-400'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}
              <span className="text-2xl ml-1 text-gray-400">円</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card border-green-500/20">
              <p className="text-gray-400 text-sm">今月の貯め合計</p>
              <p className="text-2xl font-bold text-green-400 mt-1">+{summary.saved.toLocaleString()}円</p>
            </div>
            <div className="card border-red-500/20">
              <p className="text-gray-400 text-sm">今月の使い合計</p>
              <p className="text-2xl font-bold text-red-400 mt-1">-{summary.spent.toLocaleString()}円</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">クイック実行</h2>
            <QuickLog actions={actions} />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">直近の記録</h2>
            {recentLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">まだ記録がありません</p>
            ) : (
              <ul className="space-y-3">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={log.type === 'save' ? 'badge-save' : 'badge-spend'}>
                        {log.type === 'save' ? '貯める' : '使う'}
                      </span>
                      <span className="text-gray-300 text-sm">{log.actions?.name ?? '削除済み項目'}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${log.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                        {log.type === 'save' ? '+' : '-'}{log.amount.toLocaleString()}円
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(log.executed_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
