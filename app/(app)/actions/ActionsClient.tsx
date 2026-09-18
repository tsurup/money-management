'use client'

import { useState, useTransition } from 'react'
import { createAction, updateAction, deleteAction } from '@/lib/actions/action-items'
import { useRouter } from 'next/navigation'

interface Action {
  id: string
  name: string
  type: 'save' | 'spend'
  amount: number
  memo: string | null
  is_active: boolean
}

export default function ActionsClient({ initialActions }: { initialActions: Action[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Action | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 3000) }
    else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 2000) }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = editTarget ? await updateAction(fd) : await createAction(fd)
      if ('error' in res && res.error) { flash(res.error, true); return }
      flash(editTarget ? '項目を更新しました' : '項目を追加しました')
      setShowForm(false)
      setEditTarget(null)
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('この項目を削除しますか？')) return
    startTransition(async () => {
      const res = await deleteAction(id)
      if ('error' in res && res.error) { flash(res.error, true); return }
      flash('削除しました')
      router.refresh()
    })
  }

  const saveActions = initialActions.filter((a) => a.type === 'save')
  const spendActions = initialActions.filter((a) => a.type === 'spend')

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
      {successMsg && <div className="bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">{successMsg}</div>}

      {!showForm && (
        <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="btn-primary">
          ＋ 項目を追加
        </button>
      )}

      {showForm && (
        <div className="card border-violet-500/30 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editTarget ? '項目を編集' : '新しい項目'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editTarget && <input type="hidden" name="id" value={editTarget.id} />}
            <div>
              <label className="label" htmlFor="action-name">項目名 *</label>
              <input id="action-name" name="name" required defaultValue={editTarget?.name} placeholder="例: ジョギングした" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="action-type">種別 *</label>
                <select id="action-type" name="type" defaultValue={editTarget?.type ?? 'save'} className="input">
                  <option value="save">貯める</option>
                  <option value="spend">使う</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="action-amount">金額（円）*</label>
                <input id="action-amount" name="amount" type="number" min="1" required defaultValue={editTarget?.amount} placeholder="100" className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="action-memo">メモ（任意）</label>
              <input id="action-memo" name="memo" defaultValue={editTarget?.memo ?? ''} placeholder="任意メモ" className="input" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isPending} className="btn-primary">{isPending ? '処理中...' : '保存'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditTarget(null) }} className="btn-ghost">キャンセル</button>
            </div>
          </form>
        </div>
      )}

      <ActionSection
        title="貯める項目"
        items={saveActions}
        onEdit={(a) => { setEditTarget(a); setShowForm(true) }}
        onDelete={handleDelete}
        isPending={isPending}
      />
      <ActionSection
        title="使う項目"
        items={spendActions}
        onEdit={(a) => { setEditTarget(a); setShowForm(true) }}
        onDelete={handleDelete}
        isPending={isPending}
      />
    </div>
  )
}

function ActionSection({ title, items, onEdit, onDelete, isPending }: {
  title: string
  items: Action[]
  onEdit: (a: Action) => void
  onDelete: (id: string) => void
  isPending: boolean
}) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">まだ項目がありません</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div>
                <p className="text-gray-200 font-medium">{a.name}</p>
                {a.memo && <p className="text-xs text-gray-500 mt-0.5">{a.memo}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${a.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                  {a.type === 'save' ? '+' : '-'}{a.amount.toLocaleString()}円
                </span>
                <button onClick={() => onEdit(a)} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-gray-800 transition-all">編集</button>
                <button onClick={() => onDelete(a.id)} disabled={isPending} className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
