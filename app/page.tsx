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
  const actions = actionsRes.data ?? []
  const summary = summaryRes.data ?? { saved: 0, spent: 0 }

  // ログを日付・アクションでグループ化
  const groupedLogs: any[] = []
  const groupMap = new Map<string, any>()
  for (const log of (logsRes.data ?? [])) {
    const d = new Date(log.executed_at)
    const dateStr = d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const dateKey = d.toLocaleDateString('sv-SE')
    const key = `${dateKey}_${log.action_id ?? 'null'}`

    if (!groupMap.has(key)) {
      const newGroup = {
        key,
        dateStr,
        actions: log.actions ?? null,
        type: log.type,
        totalAmount: 0,
        logs: []
      }
      groupMap.set(key, newGroup)
      groupedLogs.push(newGroup)
    }
    const group = groupMap.get(key)
    group.totalAmount += log.amount
    group.logs.push(log)
  }

  // 直近5グループを表示
  const recentGroups = groupedLogs.slice(0, 5)

  return (
    <div className="flex min-h-screen">
      <Navbar username={session.username} />
      <main className="flex-1 pt-14 pb-16 md:pt-0 md:pb-0 md:ml-56 p-4 md:p-8">
        <div className="space-y-8 animate-fade-in-up max-w-3xl">
          <div>
            <h1 className="text-3xl font-bold text-white">ダッシュボード</h1>
            <p className="text-gray-500 mt-1">こんにちは、{session.username} さん</p>
          </div>

          <div className="card bg-gradient-to-br from-violet-900/30 to-gray-900 border-violet-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800/50 pb-6 mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium">現在の残高</p>
                <p className={`text-5xl font-bold mt-2 ${balance >= 0 ? 'text-violet-300' : 'text-red-400'}`}>
                  {balance >= 0 ? '+' : ''}{balance.toLocaleString()}
                  <span className="text-2xl ml-1 text-gray-400">円</span>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-gray-900/50 px-4 py-3 rounded-2xl border border-green-500/20 flex-1 md:flex-none">
                  <p className="text-gray-500 text-xs">今月の貯め</p>
                  <p className="text-xl font-bold text-green-400 mt-0.5">+{summary.saved.toLocaleString()}円</p>
                </div>
                <div className="bg-gray-900/50 px-4 py-3 rounded-2xl border border-red-500/20 flex-1 md:flex-none">
                  <p className="text-gray-500 text-xs">今月の使い</p>
                  <p className="text-xl font-bold text-red-400 mt-0.5">-{summary.spent.toLocaleString()}円</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">クイック実行</h2>
              <QuickLog actions={actions} />
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">直近の記録</h2>
            {recentGroups.length === 0 ? (
              <p className="text-gray-500 text-sm">まだ記録がありません</p>
            ) : (
              <ul className="space-y-3">
                {recentGroups.map((group) => (
                  <li key={group.key} className="py-2 border-b border-gray-800 last:border-0">
                    <details className="group marker:content-[''] [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-3">
                          <span className={group.type === 'save' ? 'badge-save' : 'badge-spend'}>
                            {group.type === 'save' ? '貯める' : '使う'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-sm">{group.actions?.name ?? '削除済み項目'}</span>
                            {group.logs.length > 1 && (
                              <span className="bg-gray-800 text-gray-400 text-[10px] px-1.5 py-0.5 rounded-full">
                                x{group.logs.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${group.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                            {group.type === 'save' ? '+' : '-'}{group.totalAmount.toLocaleString()}円
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">{group.dateStr}</p>
                        </div>
                      </summary>
                      
                      {group.logs.length > 1 && (
                        <div className="mt-3 pl-12 space-y-2 border-l-2 border-gray-800 ml-4">
                          {group.logs.map((log: any) => (
                            <div key={log.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">
                                {new Date(log.executed_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`font-medium ${log.type === 'save' ? 'text-green-400/70' : 'text-red-400/70'}`}>
                                {log.type === 'save' ? '+' : '-'}{log.amount.toLocaleString()}円
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
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
