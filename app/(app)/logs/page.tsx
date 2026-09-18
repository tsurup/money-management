import { getLogs, getBalance } from '@/lib/actions/logs'
import { getActions } from '@/lib/actions/action-items'
import LogsClient from './LogsClient'

export default async function LogsPage() {
  const [logsRes, actionsRes, balanceRes] = await Promise.all([
    getLogs(),
    getActions(),
    getBalance(),
  ])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-white">📋 ログ一覧</h1>
        <p className="text-gray-500 mt-1">実行記録の確認・編集・削除</p>
      </div>
      <LogsClient
        initialLogs={logsRes.data ?? []}
        actions={actionsRes.data ?? []}
        balance={balanceRes.data ?? 0}
      />
    </div>
  )
}
