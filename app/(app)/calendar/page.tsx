import { getLogs } from '@/lib/actions/logs'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
  const { data: logs } = await getLogs()
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-white">カレンダー</h1>
        <p className="text-gray-500 mt-1">日別の記録を確認</p>
      </div>
      <CalendarClient logs={logs ?? []} />
    </div>
  )
}
