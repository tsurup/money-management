'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-3xl font-bold text-white">タスク貯金</h1>
          <p className="text-gray-500 mt-2">ログインして記録を続けよう</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">ログイン</h2>

          {state?.error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label className="label" htmlFor="login-username">ユーザー名</label>
              <input
                id="login-username"
                name="username"
                type="text"
                required
                placeholder="ユーザー名を入力"
                className="input"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="login-password">パスワード</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                placeholder="パスワードを入力"
                className="input"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full mt-2">
              {pending ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            アカウントをお持ちでないですか？{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">新規登録</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
