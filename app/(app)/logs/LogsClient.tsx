'use client'

import { useState, useTransition } from 'react'
import { createLog, updateLog, deleteLog } from '@/lib/actions/logs'
import { useRouter } from 'next/navigation'

interface LogRecord {
  id: string
  action_id: string | null
  amount: number
  type: 'save' | 'spend'
  memo: string | null
  executed_at: string
  actions?: { name: string } | null
}

interface Action {
  id: string
  name: string
  type: 'save' | 'spend'
  amount: number
}

interface Props {
  initialLogs: LogRecord[]
  actions: Action[]
  balance: number
}

export default function LogsClient({ initialLogs, actions, balance }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<LogRecord | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'save' | 'spend'>('all')
  const [error, setError] = useState<string | null>(null)

  function flash(msg: string) { setError(msg); setTimeout(() => setError(null), 3000) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = editTarget ? await updateLog(fd) : await createLog(fd)
      if ('error' in res && res.error) { flash(res.error); return }
      setShowForm(false); setEditTarget(null)
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('このログを削除しますか？')) return
    startTransition(async () => {
      const res = await deleteLog(id)
      if ('error' in res && res.error) { flash(res.error); return }
      router.refresh()
    })
  }

  const filtered = filterType === 'all' ? initialLogs : initialLogs.filter((l) => l.type === filterType)

  const groupedLogs: {
    key: string
    dateStr: string
    action_id: string | null
    actions: { name: string } | null
    type: 'save' | 'spend'
    totalAmount: number
    logs: LogRecord[]
  }[] = []
  const groupMap = new Map<string, typeof groupedLogs[0]>()

  for (const log of filtered) {
    const d = new Date(log.executed_at)
    const dateStr = d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const dateKey = d.toLocaleDateString('sv-SE') // YYYY-MM-DD
    const key = `${dateKey}_${log.action_id ?? 'null'}`
    
    if (!groupMap.has(key)) {
      const newGroup = {
        key,
        dateStr,
        action_id: log.action_id,
        actions: log.actions ?? null,
        type: log.type,
        totalAmount: 0,
        logs: []
      }
      groupMap.set(key, newGroup)
      groupedLogs.push(newGroup)
    }
    const group = groupMap.get(key)!
    group.totalAmount += log.amount
    group.logs.push(log)
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* フィルター + 追加ボタン */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['all', 'save', 'spend'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filterType === f ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'すべて' : f === 'save' ? '貯める' : '使う'}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="btn-primary text-sm">
          ＋ 記録を追加
        </button>
      </div>

      {/* ログフォーム */}
      {showForm && (
        <div className="card border-violet-500/30 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-white mb-4">{editTarget ? 'ログを編集' : '記録を追加'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editTarget && <input type="hidden" name="id" value={editTarget.id} />}
            {!editTarget && (
              <div>
                <label className="label" htmlFor="log-action">項目 *</label>
                <select id="log-action" name="action_id" required className="input">
                  <option value="">選択してください</option>
                  {actions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type === 'save' ? '💚' : '❤️'} {a.name}（{a.type === 'save' ? '+' : '-'}{a.amount.toLocaleString()}円）
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label" htmlFor="log-executed-at">実行日時 *</label>
              <input
                id="log-executed-at"
                name="executed_at"
                type="datetime-local"
                required
                defaultValue={editTarget ? new Date(editTarget.executed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="log-memo">メモ（任意）</label>
              <input id="log-memo" name="memo" defaultValue={editTarget?.memo ?? ''} placeholder="任意メモ" className="input" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isPending} className="btn-primary">{isPending ? '処理中...' : '保存'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditTarget(null) }} className="btn-ghost">キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ログリスト */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">記録一覧（{filtered.length}件）</h3>
          <span className={`font-bold text-lg ${balance >= 0 ? 'text-violet-300' : 'text-red-400'}`}>
            残高: {balance >= 0 ? '+' : ''}{balance.toLocaleString()}円
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">記録がありません</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((log) => (
              <li key={log.id} className="flex items-start justify-between py-3 border-b border-gray-800 last:border-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={log.type === 'save' ? 'badge-save' : 'badge-spend'}>
                    {log.type === 'save' ? '貯める' : '使う'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-200 text-sm font-medium truncate">{log.actions?.name ?? '削除済み項目'}</p>
                    {log.memo && <p className="text-xs text-gray-500">{log.memo}</p>}
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(log.executed_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold ${log.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                    {log.type === 'save' ? '+' : '-'}{log.amount.toLocaleString()}円
                  </span>
                  <button onClick={() => { setEditTarget(log); setShowForm(true) }} className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-gray-800">編集</button>
                  <button onClick={() => handleDelete(log.id)} disabled={isPending} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10">削除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
