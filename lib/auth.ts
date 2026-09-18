import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_SECRET = process.env.SESSION_SECRET || 'dummy_secret_for_build_only_32_chars_long'
const secret = new TextEncoder().encode(SESSION_SECRET)

const COOKIE_NAME = 'session'
const EXPIRY = '14d'

export interface SessionPayload {
  userId: string
  username: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Cookie からセッションを取得。未認証なら null を返す */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

/** セッションCookieをセット */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14, // 14日
    path: '/',
  })
}

/** セッションCookieを削除 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
