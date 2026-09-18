import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function UsersPage() {
  const { data: users } = await supabase
    .from('users')
    .select('username, display_name, is_log_public, is_balance_public')
    .eq('is_log_public', true)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-white">みんなの記録</h1>
        <p className="text-gray-500 mt-1">公開中のユーザーの記録を閲覧できます</p>
      </div>

      {!users || users.length === 0 ? (
        <div className="card text-gray-500">まだ公開中のユーザーはいません</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users.map((user) => (
            <Link
              key={user.username}
              href={`/users/${user.username}`}
              className="card hover:border-violet-500/40 hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center text-lg font-bold text-violet-300">
                  {(user.display_name || user.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold group-hover:text-violet-300 transition-colors">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {user.is_log_public && <span className="badge-save">ログ公開</span>}
                {user.is_balance_public && <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-1 rounded-full font-semibold">残高公開</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
