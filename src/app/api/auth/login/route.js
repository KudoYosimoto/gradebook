import { json, fail, httpError } from '@/lib/http'
import { findUserByLogin, getPublicUser, writeAudit } from '@/lib/repo'
import { verifyPassword, setSessionCookie } from '@/lib/session'
import { hashPassword } from '@/lib/crypto'
import { lockedFor, registerFail, resetFails } from '@/lib/rate-limit'

const DUMMY_HASH = hashPassword('dummy-password')

export async function POST(req) {
  try {
    const body = await req.json()
    const login = String(body.login || '').trim()
    const password = String(body.password || '')
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    const key = `${login.toLowerCase()}|${ip}`

    const wait = lockedFor(key)
    if (wait > 0) {
      throw httpError(429, `Слишком много попыток. Повторите через ${Math.ceil(wait / 60000)} мин.`)
    }

    const row = findUserByLogin(login)
    const ok = verifyPassword(password, row?.password_hash ?? DUMMY_HASH) && Boolean(row)
    if (!ok) {
      registerFail(key)
      writeAudit(null, 'Сессия', 'Неудачный вход', login.slice(0, 32))
      throw httpError(401, 'Неверный логин или пароль')
    }
    if (row.status !== 'Активен') throw httpError(403, 'Учётная запись заблокирована')

    resetFails(key)
    await setSessionCookie(row.id)
    const user = getPublicUser(row.id)
    writeAudit(user, 'Сессия', 'Вход', user.login)
    return json({ user })
  } catch (err) {
    return fail(err)
  }
}
