'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// ────────────────────────────────────────────────────────────
// 項目一覧取得
// ────────────────────────────────────────────────────────────
export async function getActions() {
  const session = await getSession()
  if (!session) return { error: '未ログインです', data: null }

  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('user_id', session.userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return { error: '項目の取得に失敗しました', data: null }
  return { data, error: null }
}

// ────────────────────────────────────────────────────────────
// 項目作成
// ────────────────────────────────────────────────────────────
export async function createAction(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as 'save' | 'spend'
  const amount = parseInt(formData.get('amount') as string, 10)
  const memo = (formData.get('memo') as string | null)?.trim() || null

  if (!name) return { error: '項目名を入力してください' }
  if (!['save', 'spend'].includes(type)) return { error: '種別が正しくありません' }
  if (isNaN(amount) || amount <= 0) return { error: '金額は1円以上の整数を入力してください' }

  const { error } = await supabase
    .from('actions')
    .insert({ user_id: session.userId, name, type, amount, memo })

  if (error) return { error: '項目の作成に失敗しました' }

  revalidatePath('/actions')
  return { success: true }
}

// ────────────────────────────────────────────────────────────
// 項目更新
// ────────────────────────────────────────────────────────────
export async function updateAction(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const id = formData.get('id') as string
  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as 'save' | 'spend'
  const amount = parseInt(formData.get('amount') as string, 10)
  const memo = (formData.get('memo') as string | null)?.trim() || null

  if (!name) return { error: '項目名を入力してください' }
  if (!['save', 'spend'].includes(type)) return { error: '種別が正しくありません' }
  if (isNaN(amount) || amount <= 0) return { error: '金額は1円以上の整数を入力してください' }

  // 本人チェック
  const { data: existing } = await supabase
    .from('actions')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!existing || existing.user_id !== session.userId) return { error: '権限がありません' }

  const { error } = await supabase
    .from('actions')
    .update({ name, type, amount, memo })
    .eq('id', id)

  if (error) return { error: '項目の更新に失敗しました' }

  revalidatePath('/actions')
  return { success: true }
}

// ────────────────────────────────────────────────────────────
// 項目削除（論理削除: is_active = false）
// ────────────────────────────────────────────────────────────
export async function deleteAction(id: string) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const { data: existing } = await supabase
    .from('actions')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!existing || existing.user_id !== session.userId) return { error: '権限がありません' }

  const { error } = await supabase
    .from('actions')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: '項目の削除に失敗しました' }

  revalidatePath('/actions')
  return { success: true }
}
