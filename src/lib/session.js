import { cookies } from 'next/headers'
import { COOKIE_NAME, MAX_AGE, signSession, readSession } from './crypto.js'

export { hashPassword, verifyPassword, signSession, readSession, COOKIE_NAME } from './crypto.js'

const OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_INSECURE !== '1',
  path: '/',
}

export async function setSessionCookie(userId) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, signSession(userId), { ...OPTIONS, maxAge: MAX_AGE })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(COOKIE_NAME, '', { ...OPTIONS, maxAge: 0 })
}

/** id вошедшего пользователя или null. */
export async function getSessionUserId() {
  const jar = await cookies()
  return readSession(jar.get(COOKIE_NAME)?.value)
}
