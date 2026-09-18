'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const NAV_ITEMS = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/actions', label: '項目管理', icon: '⚡' },
  { href: '/logs', label: 'ログ', icon: '📋' },
  { href: '/calendar', label: 'カレンダー', icon: '📅' },
  { href: '/users', label: 'みんな', icon: '👥' },
  { href: '/settings', label: '設定', icon: '⚙️' },
]

export default function Navbar({ username }: { username: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* モバイル用トップヘッダー（必要に応じて） */}
      <div className="md:hidden fixed top-0 left-0 w-full h-14 bg-gray-900 border-b border-gray-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-bold text-white text-sm">タスク貯金</span>
        </div>
        <form action={logout}>
          <button type="submit" className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg font-medium">ログアウト</button>
        </form>
      </div>

      {/* ナビゲーションバー（PC：左サイド, モバイル：ボトム） */}
      <nav className="fixed bottom-0 left-0 w-full md:w-56 h-16 md:h-full bg-gray-900/95 backdrop-blur-md md:bg-gray-900 border-t md:border-t-0 md:border-r border-gray-800 flex flex-row md:flex-col z-50">
        
        {/* PC用ヘッダーエリア */}
        <div className="hidden md:flex p-5 border-b border-gray-800 items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-bold text-white text-sm">タスク貯金</p>
            <p className="text-xs text-gray-500">@{username}</p>
          </div>
        </div>

        {/* ナビゲーションリンク */}
        <div className="flex-1 flex flex-row md:flex-col p-1 md:p-3 items-center md:items-stretch justify-around md:justify-start gap-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-1.5 md:p-3 rounded-xl transition-all w-full min-w-[50px] ${
                  isActive ? 'text-white bg-violet-600/20 md:bg-violet-600 font-semibold' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="text-lg md:text-base">{icon}</span>
                <span className="text-[10px] md:text-sm truncate">{label}</span>
              </Link>
            )
          })}
        </div>

        {/* PC用ログアウト */}
        <div className="hidden md:block p-3 border-t border-gray-800 space-y-1">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-3 w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 p-3 rounded-xl transition-all text-sm font-medium">
              <span className="text-base">🚪</span>ログアウト
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
