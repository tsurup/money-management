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
      <div className="grid grid-cols-2 gap-4">
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
        {!logs || logs.length === 0 ? (
          <p className="text-gray-500 text-sm">記録がありません</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={log.type === 'save' ? 'badge-save' : 'badge-spend'}>
                    {log.type === 'save' ? '貯める' : '使う'}
                  </span>
                  <div>
                    <p className="text-gray-300 text-sm">{log.actions?.name ?? '削除済み'}</p>
                    <p className="text-xs text-gray-600">{new Date(log.executed_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${log.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                  {log.type === 'save' ? '+' : '-'}{log.amount.toLocaleString()}円
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
