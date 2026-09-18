'use client'

import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

interface LogRecord {
  id: string
  action_id: string | null
  amount: number
  type: 'save' | 'spend'
  memo: string | null
  executed_at: string
  actions?: { name: string } | null
}

export default function CalendarClient({ logs }: { logs: LogRecord[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 日付ごとのログマップ
  const logsByDate = logs.reduce<Record<string, LogRecord[]>>((acc, log) => {
    const key = new Date(log.executed_at).toLocaleDateString('sv-SE') // YYYY-MM-DD
    ;(acc[key] = acc[key] || []).push(log)
    return acc
  }, {})

  const selectedKey = selectedDate?.toLocaleDateString('sv-SE')
  const selectedLogs = selectedKey ? (logsByDate[selectedKey] ?? []) : []

  // グループ化
  const groupedLogs: {
    key: string
    action_id: string | null
    actions: { name: string } | null
    type: 'save' | 'spend'
    totalAmount: number
    logs: LogRecord[]
  }[] = []
  const groupMap = new Map<string, typeof groupedLogs[0]>()

  for (const log of selectedLogs) {
    const key = log.action_id ?? 'null'
    if (!groupMap.has(key)) {
      const newGroup = {
        key,
        action_id: log.action_id,
        actions: log.actions,
        type: log.type,
        totalAmount: 0,
        logs: []
      }
      groupMap.set(key, newGroup)
      groupedLogs.push(newGroup)
    }
    const group = groupMap.get(key)!
    group.totalAmount += log.amount
    group.logs.push(log)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* カレンダー */}
      <div className="card">
        <style>{`
          .react-calendar {
            background: transparent;
            border: none;
            color: #e5e7eb;
            width: 100%;
            font-family: inherit;
          }
          .react-calendar__navigation button {
            color: #e5e7eb;
            background: none;
            font-size: 1rem;
            font-weight: 600;
          }
          .react-calendar__navigation button:hover { background: #1f2937; border-radius: 8px; }
          .react-calendar__month-view__weekdays { color: #6b7280; font-size: 0.75rem; }
          .react-calendar__tile { color: #d1d5db; padding: 0.6rem 0.3rem; border-radius: 8px; }
          .react-calendar__tile:hover { background: #1f2937; }
          .react-calendar__tile--active { background: #7c3aed !important; color: white; }
          .react-calendar__tile--now { background: #374151; }
          .react-calendar__tile abbr { display: block; }
        `}</style>
        <Calendar
          onChange={(v) => setSelectedDate(v as Date)}
          value={selectedDate}
          locale="ja-JP"
          calendarType="gregory"
          tileContent={({ date }) => {
            const key = date.toLocaleDateString('sv-SE')
            const dayLogs = logsByDate[key]
            if (!dayLogs) return null
            const saved = dayLogs.filter((l) => l.type === 'save').reduce((s, l) => s + l.amount, 0)
            const spent = dayLogs.filter((l) => l.type === 'spend').reduce((s, l) => s + l.amount, 0)
            return (
              <div className="text-center mt-0.5 space-y-0.5">
                {saved > 0 && <div className="text-green-400 text-[9px] font-bold leading-none">+{saved}</div>}
                {spent > 0 && <div className="text-red-400 text-[9px] font-bold leading-none">-{spent}</div>}
              </div>
            )
          }}
        />
      </div>

      {/* 選択した日のログ */}
      <div className="card">
        {!selectedDate ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            日付を選択してください
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            {groupedLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">この日の記録はありません</p>
            ) : (
              <ul className="space-y-3">
                {groupedLogs.map((group) => {
                  const isExpanded = expandedGroups.has(group.key)
                  return (
                    <li key={group.key} className="py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={group.type === 'save' ? 'badge-save' : 'badge-spend'}>
                            {group.type === 'save' ? '貯める' : '使う'}
                          </span>
                          <span className="text-gray-300 text-sm">{group.actions?.name ?? '削除済み'}</span>
                          {group.logs.length > 1 && (
                            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                              x{group.logs.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-sm ${group.type === 'save' ? 'text-green-400' : 'text-red-400'}`}>
                            {group.type === 'save' ? '+' : '-'}{group.totalAmount.toLocaleString()}円
                          </span>
                          {group.logs.length > 1 && (
                            <button
                              onClick={() => toggleGroup(group.key)}
                              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800"
                            >
                              {isExpanded ? '閉じる' : '詳細'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && group.logs.length > 1 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-800 space-y-2">
                          {group.logs.map(log => (
                            <div key={log.id} className="flex justify-between items-center text-sm">
                              <div className="text-gray-400">
                                <span>{new Date(log.executed_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                                {log.memo && <span className="ml-2 text-gray-500">- {log.memo}</span>}
                              </div>
                              <span className={log.type === 'save' ? 'text-green-400/70' : 'text-red-400/70'}>
                                {log.type === 'save' ? '+' : '-'}{log.amount.toLocaleString()}円
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
                <li className="pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-gray-400">この日の収支</span>
                  <span className={
                    selectedLogs.reduce((s, l) => s + (l.type === 'save' ? l.amount : -l.amount), 0) >= 0
                      ? 'text-green-400' : 'text-red-400'
                  }>
                    {selectedLogs.reduce((s, l) => s + (l.type === 'save' ? l.amount : -l.amount), 0) >= 0 ? '+' : ''}
                    {selectedLogs.reduce((s, l) => s + (l.type === 'save' ? l.amount : -l.amount), 0).toLocaleString()}円
                  </span>
                </li>
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
