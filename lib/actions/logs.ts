'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export interface LogRecord {
  id: string
  user_id: string
  action_id: string | null
  amount: number
  type: 'save' | 'spend'
  memo: string | null
  executed_at: string
  created_at: string
  actions?: { name: string } | null
}

// ────────────────────────────────────────────────────────────
// ログ一覧取得（自分）
// ────────────────────────────────────────────────────────────
export async function getLogs(filters?: {
  type?: 'save' | 'spend'
  from?: string
  to?: string
  actionId?: string
}) {
  const session = await getSession()
  if (!session) return { error: '未ログインです', data: null }

  let query = supabase
    .from('logs')
    .select('*, actions(name)')
    .eq('user_id', session.userId)
    .order('executed_at', { ascending: false })

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.from) query = query.gte('executed_at', filters.from)
  if (filters?.to) query = query.lte('executed_at', filters.to)
  if (filters?.actionId) query = query.eq('action_id', filters.actionId)

  const { data, error } = await query
  if (error) return { error: 'ログの取得に失敗しました', data: null }
  return { data: data as LogRecord[], error: null }
}

// ────────────────────────────────────────────────────────────
// 残高取得
// ────────────────────────────────────────────────────────────
export async function getBalance(userId?: string) {
  const session = await getSession()
  if (!session) return { error: '未ログインです', data: null }

  const targetId = userId ?? session.userId

  // 他人の残高の場合、公開設定チェック
  if (targetId !== session.userId) {
    const { data: user } = await supabase
      .from('users')
      .select('is_balance_public')
      .eq('id', targetId)
      .single()
    if (!user?.is_balance_public) return { error: '非公開ユーザーです', data: null }
  }

  const { data, error } = await supabase
    .from('balances')
    .select('balance')
    .eq('user_id', targetId)
    .maybeSingle()

  if (error) return { error: '残高の取得に失敗しました', data: null }
  return { data: data?.balance ?? 0, error: null }
}

// ────────────────────────────────────────────────────────────
// ログ作成
// ────────────────────────────────────────────────────────────
export async function createLog(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const actionId = formData.get('action_id') as string
  const memo = (formData.get('memo') as string | null)?.trim() || null
  const executedAt = (formData.get('executed_at') as string) || new Date().toISOString()

  // 対象アクションが本人のものか確認 & スナップショット取得
  const { data: action } = await supabase
    .from('actions')
    .select('user_id, type, amount')
    .eq('id', actionId)
    .single()
  if (!action || action.user_id !== session.userId) return { error: '権限がありません' }

  const { error } = await supabase.from('logs').insert({
    user_id: session.userId,
    action_id: actionId,
    amount: action.amount,
    type: action.type,
    memo,
    executed_at: executedAt,
  })

  if (error) return { error: 'ログの記録に失敗しました' }

  revalidatePath('/')
  revalidatePath('/logs')
  revalidatePath('/calendar')
  return { success: true }
}

// ────────────────────────────────────────────────────────────
// ログ更新
// ────────────────────────────────────────────────────────────
export async function updateLog(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const id = formData.get('id') as string
  const memo = (formData.get('memo') as string | null)?.trim() || null
  const executedAt = formData.get('executed_at') as string

  const { data: existing } = await supabase
    .from('logs')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!existing || existing.user_id !== session.userId) return { error: '権限がありません' }

  const { error } = await supabase
    .from('logs')
    .update({ memo, executed_at: executedAt })
    .eq('id', id)

  if (error) return { error: 'ログの更新に失敗しました' }

  revalidatePath('/logs')
  revalidatePath('/calendar')
  revalidatePath('/')
  return { success: true }
}

// ────────────────────────────────────────────────────────────
// ログ削除
// ────────────────────────────────────────────────────────────
export async function deleteLog(id: string) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const { data: existing } = await supabase
    .from('logs')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!existing || existing.user_id !== session.userId) return { error: '権限がありません' }

  const { error } = await supabase.from('logs').delete().eq('id', id)
  if (error) return { error: 'ログの削除に失敗しました' }

  revalidatePath('/logs')
  revalidatePath('/calendar')
  revalidatePath('/')
  return { success: true }
}

// ────────────────────────────────────────────────────────────
// 他ユーザーのログ取得（公開設定チェック）
// ────────────────────────────────────────────────────────────
export async function getPublicLogs(username: string) {
  const session = await getSession()
  if (!session) return { error: '未ログインです', data: null, user: null }

  const { data: user } = await supabase
    .from('users')
    .select('id, display_name, username, is_log_public, is_balance_public')
    .eq('username', username)
    .maybeSingle()

  if (!user) return { error: 'ユーザーが見つかりません', data: null, user: null }
  if (!user.is_log_public) return { error: 'このユーザーは非公開です', data: null, user: null }

  const { data, error } = await supabase
    .from('logs')
    .select('*, actions(name)')
    .eq('user_id', user.id)
    .order('executed_at', { ascending: false })
    .limit(100)

  if (error) return { error: 'ログの取得に失敗しました', data: null, user: null }
  return { data: data as LogRecord[], error: null, user }
}

// ────────────────────────────────────────────────────────────
// 月間サマリー取得
// ────────────────────────────────────────────────────────────
export async function getMonthlySummary(year: number, month: number) {
  const session = await getSession()
  if (!session) return { error: '未ログインです', data: null }

  const from = new Date(year, month - 1, 1).toISOString()
  const to = new Date(year, month, 1).toISOString()

  const { data, error } = await supabase
    .from('logs')
    .select('type, amount')
    .eq('user_id', session.userId)
    .gte('executed_at', from)
    .lt('executed_at', to)

  if (error) return { error: 'サマリーの取得に失敗しました', data: null }

  const saved = data.filter((l) => l.type === 'save').reduce((s, l) => s + l.amount, 0)
  const spent = data.filter((l) => l.type === 'spend').reduce((s, l) => s + l.amount, 0)
  return { data: { saved, spent }, error: null }
}
