'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions/auth'
import Link from 'next/link'

interface Props {
  displayName: string
  isLogPublic: boolean
  isBalancePublic: boolean
}

export default function SettingsClient({ displayName, isLogPublic, isBalancePublic }: Props) {
  const [isPending, startTransition] = useTransition()
  const [logPublic, setLogPublic] = useState(isLogPublic)
  const [balancePublic, setBalancePublic] = useState(isBalancePublic)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function flash(text: string, ok: boolean) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('is_log_public', String(logPublic))
    fd.set('is_balance_public', String(balancePublic))
    startTransition(async () => {
      const res = await updateProfile(fd)
      if ('error' in res && res.error) { flash(res.error, false); return }
      flash('設定を保存しました', true)
    })
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">プロフィール</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="display-name">表示名</label>
            <input id="display-name" name="display_name" defaultValue={displayName} placeholder="表示名" className="input" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-400">公開設定</p>
            <Toggle
              id="log-public"
              label="ログを公開する"
              description="他のユーザーがあなたの記録を閲覧できます"
              checked={logPublic}
              onChange={setLogPublic}
            />
            <Toggle
              id="balance-public"
              label="残高を公開する"
              description="他のユーザーがあなたの残高を閲覧できます"
              checked={balancePublic}
              onChange={setBalancePublic}
            />
          </div>

          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? '保存中...' : '変更を保存'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">アカウント</h2>
        <Link href="/settings/account" className="btn-ghost inline-block">
          パスワード変更・アカウント削除
        </Link>
      </div>
    </div>
  )
}

function Toggle({ id, label, description, checked, onChange }: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer group">
      <div>
        <p className="text-gray-200 text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs">{description}</p>
      </div>
      <div className="relative ml-4">
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-violet-600' : 'bg-gray-700'}`} />
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : ''}`} />
      </div>
    </label>
  )
}
