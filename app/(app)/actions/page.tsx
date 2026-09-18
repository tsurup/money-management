import { getActions } from '@/lib/actions/action-items'
import ActionsClient from './ActionsClient'

export default async function ActionsPage() {
  const { data: actions } = await getActions()
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-white">項目管理</h1>
        <p className="text-gray-500 mt-1">貯める・使う項目を管理します</p>
      </div>
      <ActionsClient initialActions={actions ?? []} />
    </div>
  )
}
