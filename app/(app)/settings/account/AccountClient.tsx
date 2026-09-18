'use client'

import { useState, useTransition } from 'react'
import { changeUsername, changePassword, deleteAccount } from '@/lib/actions/auth'

export default function AccountClient() {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function flash(text: string, ok: boolean) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000) }

  async function handleChangeUsername(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await changeUsername(fd)
      if ('error' in res && res.error) { flash(res.error, false); return }
      flash('ユーザー名を変更しました', true)
      ;(e.target as HTMLFormElement).reset()
    })
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await changePassword(fd)
      if ('error' in res && res.error) { flash(res.error, false); return }
      flash('パスワードを変更しました', true)
      ;(e.target as HTMLFormElement).reset()
    })
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await deleteAccount(fd)
    })
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* ユーザー名変更 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">ユーザー名変更</h2>
        <form onSubmit={handleChangeUsername} className="space-y-4">
          <div>
            <label className="label" htmlFor="new-username">新しいユーザー名</label>
            <input id="new-username" name="new_username" required placeholder="新しいユーザー名" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="cu-password-username">現在のパスワード（本人確認）</label>
            <input id="cu-password-username" name="current_password" type="password" required placeholder="現在のパスワード" className="input" />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">変更する</button>
        </form>
      </div>

      {/* パスワード変更 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">パスワード変更</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label" htmlFor="cu-password-pw">現在のパスワード</label>
            <input id="cu-password-pw" name="current_password" type="password" required placeholder="現在のパスワード" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="new-password">新しいパスワード</label>
            <input id="new-password" name="new_password" type="password" required placeholder="8文字以上、英字と数字を含む" className="input" />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">変更する</button>
        </form>
      </div>

      {/* アカウント削除 */}
      <div className="card border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-2">アカウント削除</h2>
        <p className="text-gray-500 text-sm mb-4">削除すると全てのデータが失われます。この操作は取り消せません。</p>
        <button onClick={() => setShowDeleteModal(true)} className="btn-danger">アカウントを削除する</button>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full border-red-500/30 animate-fade-in-up">
            <h3 className="text-lg font-bold text-white mb-2">本当に削除しますか？</h3>
            <p className="text-gray-400 text-sm mb-6">アカウントと全ての記録が完全に削除されます。</p>
            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label className="label" htmlFor="delete-password">現在のパスワードを入力して確認</label>
                <input id="delete-password" name="current_password" type="password" required placeholder="パスワード" className="input" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={isPending} className="btn-danger flex-1">
                  {isPending ? '削除中...' : '削除する'}
                </button>
                <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-ghost flex-1">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
