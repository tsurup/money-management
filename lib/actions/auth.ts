'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hashPassword, comparePassword, validatePassword, validateUsername } from '@/lib/password'
import { createSession, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10分

async function checkRateLimit(username: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('username', username)
    .eq('success', false)
    .gte('attempted_at', since)
  return (count ?? 0) >= RATE_LIMIT_MAX
}

async function recordLoginAttempt(username: string, success: boolean) {
  await supabase.from('login_attempts').insert({ username, success })
}

// ────────────────────────────────────────────────────────────
// 新規登録
// ────────────────────────────────────────────────────────────
export async function register(_prevState: { error: string } | undefined, formData: FormData) {
  const username = (formData.get('username') as string).trim()
  const password = formData.get('password') as string
  const displayName = (formData.get('display_name') as string | null)?.trim() || null

  const usernameError = validateUsername(username)
  if (usernameError) return { error: usernameError }

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  // 重複チェック
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (existing) return { error: 'このユーザー名はすでに使用されています' }

  const password_hash = await hashPassword(password)
  const { data: user, error } = await supabase
    .from('users')
    .insert({ username, password_hash, display_name: displayName })
    .select('id, username')
    .single()

  if (error || !user) return { error: '登録に失敗しました' }

  const token = await createSession({ userId: user.id, username: user.username })
  await setSessionCookie(token)
  redirect('/')
}

// ────────────────────────────────────────────────────────────
// ログイン
// ────────────────────────────────────────────────────────────
export async function login(_prevState: { error: string } | undefined, formData: FormData) {
  const username = (formData.get('username') as string).trim()
  const password = formData.get('password') as string

  const locked = await checkRateLimit(username)
  if (locked) return { error: 'ログイン試行回数が上限に達しました。10分後に再試行してください' }

  const { data: user } = await supabase
    .from('users')
    .select('id, username, password_hash')
    .eq('username', username)
    .maybeSingle()

  if (!user) {
    await recordLoginAttempt(username, false)
    return { error: 'ユーザー名またはパスワードが正しくありません' }
  }

  const ok = await comparePassword(password, user.password_hash)
  if (!ok) {
    await recordLoginAttempt(username, false)
    return { error: 'ユーザー名またはパスワードが正しくありません' }
  }

  await recordLoginAttempt(username, true)
  const token = await createSession({ userId: user.id, username: user.username })
  await setSessionCookie(token)
  redirect('/')
}

// ────────────────────────────────────────────────────────────
// ログアウト
// ────────────────────────────────────────────────────────────
export async function logout() {
  await clearSessionCookie()
  redirect('/login')
}

// ────────────────────────────────────────────────────────────
// ユーザー名変更
// ────────────────────────────────────────────────────────────
export async function changeUsername(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const newUsername = (formData.get('new_username') as string).trim()
  const currentPassword = formData.get('current_password') as string

  const usernameError = validateUsername(newUsername)
  if (usernameError) return { error: usernameError }

  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', session.userId)
    .single()
  if (!user) return { error: 'ユーザーが見つかりません' }

  const ok = await comparePassword(currentPassword, user.password_hash)
  if (!ok) return { error: '現在のパスワードが正しくありません' }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', newUsername)
    .maybeSingle()
  if (existing) return { error: 'このユーザー名はすでに使用されています' }

  const { error } = await supabase
    .from('users')
    .update({ username: newUsername, updated_at: new Date().toISOString() })
    .eq('id', session.userId)
  if (error) return { error: 'ユーザー名の変更に失敗しました' }

  const token = await createSession({ userId: session.userId, username: newUsername })
  await setSessionCookie(token)
  return { success: true }
}

// ────────────────────────────────────────────────────────────
// パスワード変更
// ────────────────────────────────────────────────────────────
export async function changePassword(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string

  const passwordError = validatePassword(newPassword)
  if (passwordError) return { error: passwordError }

  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', session.userId)
    .single()
  if (!user) return { error: 'ユーザーが見つかりません' }

  const ok = await comparePassword(currentPassword, user.password_hash)
  if (!ok) return { error: '現在のパスワードが正しくありません' }

  const newHash = await hashPassword(newPassword)
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('id', session.userId)
  if (error) return { error: 'パスワードの変更に失敗しました' }

  return { success: true }
}

// ────────────────────────────────────────────────────────────
// アカウント削除
// ────────────────────────────────────────────────────────────
export async function deleteAccount(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const currentPassword = formData.get('current_password') as string

  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', session.userId)
    .single()
  if (!user) return { error: 'ユーザーが見つかりません' }

  const ok = await comparePassword(currentPassword, user.password_hash)
  if (!ok) return { error: 'パスワードが正しくありません' }

  const { error } = await supabase.from('users').delete().eq('id', session.userId)
  if (error) return { error: 'アカウントの削除に失敗しました' }

  await clearSessionCookie()
  redirect('/')
}

// ────────────────────────────────────────────────────────────
// プロフィール更新
// ────────────────────────────────────────────────────────────
export async function updateProfile(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: '未ログインです' }

  const displayName = (formData.get('display_name') as string | null)?.trim() || null
  const isLogPublic = formData.get('is_log_public') === 'true'
  const isBalancePublic = formData.get('is_balance_public') === 'true'

  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName, is_log_public: isLogPublic, is_balance_public: isBalancePublic })
    .eq('id', session.userId)
  if (error) return { error: 'プロフィールの更新に失敗しました' }

  return { success: true }
}
