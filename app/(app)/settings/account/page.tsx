import AccountClient from './AccountClient'

export default function AccountPage() {
  return (
    <div className="space-y-6 animate-fade-in-up max-w-xl">
      <div>
        <h1 className="text-3xl font-bold text-white">🔐 アカウント設定</h1>
        <p className="text-gray-500 mt-1">ユーザー名・パスワード変更、アカウント削除</p>
      </div>
      <AccountClient />
    </div>
  )
}
