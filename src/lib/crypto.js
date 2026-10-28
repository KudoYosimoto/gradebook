import fs from 'fs'
import path from 'path'
import { randomBytes, scryptSync, createHmac, timingSafeEqual } from 'crypto'

export const COOKIE_NAME = 'gb_session'
export const MAX_AGE = 60 * 60 * 8 // сессия живёт 8 часов, потом нужно войти заново

const SCRYPT = { N: 16384, r: 8, p: 1 }
const KEY_LEN = 64

let cachedSecret = null
function getSecret() {
  if (cachedSecret) return cachedSecret
  if (process.env.SESSION_SECRET) {
    cachedSecret = process.env.SESSION_SECRET
    return cachedSecret
  }
  const file = path.join(process.cwd(), 'data', '.session-secret')
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, randomBytes(32).toString('hex'))
  }
  cachedSecret = fs.readFileSync(file, 'utf8').trim()
  return cachedSecret
}

/**
 * Хеш пароля: scrypt + случайная соль.
 * Результат: "scrypt$<соль>$<хеш>". Сам пароль нигде не сохраняется.
 * Соль разная у каждого пользователя, поэтому одинаковые пароли дают разные хеши.
 */
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(String(password), salt, KEY_LEN, SCRYPT).toString('hex')
  return `scrypt$${salt}$${hash}`
}

/**
 * Проверка пароля: берём соль из сохранённой строки, считаем хеш заново и сравниваем.
 * timingSafeEqual сравнивает за одинаковое время — по скорости ответа нельзя угадать символы.
 */
export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false
  const [algo, salt, hash] = stored.split('$')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(String(password), salt, expected.length, SCRYPT)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/**
 * Подписанный токен сессии: "<данные в base64>.<подпись HMAC-SHA256>".
 * В данных только id пользователя и время окончания. Роль НЕ кладём:
 * её каждый раз читаем из базы, чтобы блокировка/смена роли действовали сразу.
 */
export function signSession(userId, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    uid: userId,
    exp: now + MAX_AGE * 1000,
  })).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/**
 * Проверка токена. Возвращает id пользователя или null, если:
 * токена нет, подпись не совпала (подделка), срок истёк или данные битые.
 */
export function readSession(token, now = Date.now()) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.uid || data.exp < now) return null
    return data.uid
  } catch {
    return null
  }
}
