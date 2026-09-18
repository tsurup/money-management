'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'

export default function SignupPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-3xl font-bold text-white">タスク貯金</h1>
          <p className="text-gray-500 mt-2">アカウントを作成してはじめましょう</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">新規登録</h2>

          {state?.error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label className="label" htmlFor="signup-username">ユーザー名 *</label>
              <input
                id="signup-username"
                name="username"
                type="text"
                required
                placeholder="例: taro_123"
                className="input"
                autoComplete="username"
              />
              <p className="text-xs text-gray-600 mt-1">3〜20文字、英数字とアンダースコアのみ</p>
            </div>

            <div>
              <label className="label" htmlFor="signup-display-name">表示名（任意）</label>
              <input
                id="signup-display-name"
                name="display_name"
                type="text"
                placeholder="例: 太郎"
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="signup-password">パスワード *</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                placeholder="8文字以上、英字と数字を含む"
                className="input"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full mt-2">
              {pending ? '登録中...' : 'アカウントを作成'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
