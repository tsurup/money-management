'use client'

import { useState, useTransition } from 'react'
import { createLog } from '@/lib/actions/logs'
import { useRouter } from 'next/navigation'

interface Action {
  id: string
  name: string
  type: 'save' | 'spend'
  amount: number
}

export default function QuickLog({ actions }: { actions: Action[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const saveActions = actions.filter((a) => a.type === 'save')
  const spendActions = actions.filter((a) => a.type === 'spend')

  async function handleQuickLog(actionId: string) {
    const fd = new FormData()
    fd.append('action_id', actionId)
    fd.append('executed_at', new Date().toISOString())
    startTransition(async () => {
      const res = await createLog(fd)
      if ('error' in res && res.error) {
        setMessage({ text: res.error, ok: false })
      } else {
        setMessage({ text: '記録しました！', ok: true })
        router.refresh()
      }
      setTimeout(() => setMessage(null), 2000)
    })
  }

  if (actions.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        まだ項目がありません。<a href="/actions" className="text-violet-400 underline">項目管理</a>から追加してください。
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`text-sm px-4 py-2 rounded-xl ${message.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {saveActions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">貯める</p>
          <div className="flex flex-wrap gap-2">
            {saveActions.map((a) => (
              <button
                key={a.id}
                onClick={() => handleQuickLog(a.id)}
                disabled={isPending}
                className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
              >
                <span>✅</span>{a.name}
                <span className="text-green-500 font-bold">+{a.amount.toLocaleString()}円</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {spendActions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">使う</p>
          <div className="flex flex-wrap gap-2">
            {spendActions.map((a) => (
              <button
                key={a.id}
                onClick={() => handleQuickLog(a.id)}
                disabled={isPending}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
              >
                <span>💸</span>{a.name}
                <span className="text-red-400 font-bold">-{a.amount.toLocaleString()}円</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
