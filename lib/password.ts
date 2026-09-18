import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'パスワードは8文字以上にしてください'
  if (!/[A-Za-z]/.test(password)) return 'パスワードには英字を含めてください'
  if (!/[0-9]/.test(password)) return 'パスワードには数字を含めてください'
  return null
}

export function validateUsername(username: string): string | null {
  if (username.length < 3) return 'ユーザー名は3文字以上にしてください'
  if (username.length > 20) return 'ユーザー名は20文字以内にしてください'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'ユーザー名は英数字とアンダースコアのみ使用できます'
  return null
}
