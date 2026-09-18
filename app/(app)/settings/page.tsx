import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null

  const { data: user } = await supabase
    .from('users')
    .select('display_name, is_log_public, is_balance_public')
    .eq('id', session.userId)
    .single()

  return (
    <div className="space-y-6 animate-fade-in-up max-w-xl">
      <div>
        <h1 className="text-3xl font-bold text-white">⚙️ 設定</h1>
        <p className="text-gray-500 mt-1">プロフィール・公開設定</p>
      </div>
      <SettingsClient
        displayName={user?.display_name ?? ''}
        isLogPublic={user?.is_log_public ?? false}
        isBalancePublic={user?.is_balance_public ?? false}
      />
    </div>
  )
}
