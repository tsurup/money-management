import { getPublicLogs, getBalance } from '@/lib/actions/logs'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserPage({ params }: Props) {
  const { username } = await params
  const { data: logs, error, user } = await getPublicLogs(username)

  if (error || !user) notFound()

  let balance: number | null = null
  if (user.is_balance_public) {
    const balanceRes = await getBalance(user.id)
    balance = balanceRes.data ?? 0
  }

  const saved = logs?.filter((l) => l.type === 'save').reduce((s, l) => s + l.amount, 0) ?? 0
  const spent = logs?.filter((l) => l.type === 'spend').reduce((s, l) => s + l.amount, 0) ?? 0

  const groupedLogs: any[] = []
  const groupMap = new Map<string, any>()
  for (const log of (logs ?? [])) {
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

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      {/* ユーザーヘッダー */}
      <div className="card bg-gradient-to-br from-violet-900/30 to-gray-900 border-violet-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-600/40 flex items-center justify-center text-2xl">
            {(user.display_name || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.display_name || user.username}</h1>
            <p className="text-gray-500">@{user.username}</p>
          </div>
        </div>
        {balance !== null && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">残高</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-violet-300' : 'text-red-400'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}円
            </p>
          </div>
        )}
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card border-green-500/20">
          <p className="text-gray-400 text-sm">合計貯め</p>
          <p className="text-xl font-bold text-green-400 mt-1">+{saved.toLocaleString()}円</p>
        </div>
        <div className="card border-red-500/20">
          <p className="text-gray-400 text-sm">合計使い</p>
          <p className="text-xl font-bold text-red-400 mt-1">-{spent.toLocaleString()}円</p>
        </div>
      </div>

      {/* ログ一覧 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">記録一覧</h2>
        {!logs || groupedLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">記録がありません</p>
        ) : (
          <ul className="space-y-3">
            {groupedLogs.map((group) => (
              <li key={group.key} className="py-2 border-b border-gray-800 last:border-0">
                <details className="group marker:content-[''] [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div className="flex items-center gap-3">
                      <span className={group.type === 'save' ? 'badge-save' : 'badge-spend'}>
                        {group.type === 'save' ? '貯める' : '使う'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-sm">{group.actions?.name ?? '削除済み'}</span>
                        {group.logs.length > 1 && (
                          <span className="bg-gray-800 text-gray-400 text-[10px] px-1.5 py-0.5 rounded-full">
                            x{group.logs.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${group.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                        {group.type === 'save' ? '+' : '-'}{group.totalAmount.toLocaleString()}円
                      </span>
                      <p className="text-xs text-gray-600 mt-0.5">{group.dateStr}</p>
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
  )
}
