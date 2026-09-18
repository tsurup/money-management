'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const NAV_ITEMS = [
  { href: '/', label: 'ダッシュボード', icon: '🏠' },
  { href: '/actions', label: '項目管理', icon: '⚡' },
  { href: '/logs', label: 'ログ', icon: '📋' },
  { href: '/calendar', label: 'カレンダー', icon: '📅' },
  { href: '/users', label: 'みんなの記録', icon: '👥' },
]

export default function Navbar({ username }: { username: string }) {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-bold text-white text-sm">タスク貯金</p>
            <p className="text-xs text-gray-500">@{username}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={isActive ? 'nav-link-active' : 'nav-link'}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </div>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          href="/settings"
          className={pathname.startsWith('/settings') ? 'nav-link-active' : 'nav-link'}
        >
          <span>⚙️</span>設定
        </Link>
        <form action={logout}>
          <button type="submit" className="nav-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <span>🚪</span>ログアウト
          </button>
        </form>
      </div>
    </nav>
  )
}
