// Тесты криптографии: хеш пароля (scrypt), подпись сессии (HMAC) и защита от подбора.
import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, signSession, readSession } from '../src/lib/crypto.js'
import { lockedFor, registerFail, resetFails, MAX_FAILS, WINDOW_MS } from '../src/lib/rate-limit.js'

test('хеш в формате scrypt$соль$хеш, пароля в нём нет', () => {
  const stored = hashPassword('admin123')
  assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
  assert.equal(stored.includes('admin123'), false)
})

test('одинаковый пароль и соль дают один хеш', () => {
  assert.equal(hashPassword('x', 's'), hashPassword('x', 's'))
})

test('одинаковый пароль без явной соли даёт разные хеши (случайная соль)', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'))
})

test('разный пароль даёт другой хеш', () => {
  assert.notEqual(hashPassword('a', 's'), hashPassword('b', 's'))
})

test('verifyPassword принимает верный пароль', () => {
  assert.equal(verifyPassword('dean123', hashPassword('dean123')), true)
})

test('verifyPassword отвергает неверный пароль', () => {
  assert.equal(verifyPassword('wrong', hashPassword('dean123')), false)
})

test('verifyPassword отвергает пустое и битое хранилище', () => {
  assert.equal(verifyPassword('a', ''), false)
  assert.equal(verifyPassword('a', null), false)
  assert.equal(verifyPassword('a', 'plain-text-password'), false)
})

test('старый формат sha256 не принимается', () => {
  assert.equal(verifyPassword('admin123', 'salt:abc'), false)
})

test('сессия подписывается и читается', () => {
  const token = signSession(7, 1_000_000)
  assert.equal(readSession(token, 1_000_000), 7)
})

test('подделанная подпись не проходит', () => {
  const token = signSession(7, 1_000_000)
  const [payload] = token.split('.')
  assert.equal(readSession(`${payload}.aaa`, 1_000_000), null)
})

test('подмена id в данных токена ломает подпись', () => {
  const token = signSession(7, 1_000_000)
  const [, sig] = token.split('.')
  const fake = Buffer.from(JSON.stringify({ uid: 1, exp: 9e15 })).toString('base64url')
  assert.equal(readSession(`${fake}.${sig}`, 1_000_000), null)
})

test('истёкшая сессия не проходит', () => {
  const token = signSession(3, 1_000)
  assert.equal(readSession(token, 1_000 + 9 * 60 * 60 * 1000), null)
})

test('пустой токен — null', () => {
  assert.equal(readSession(''), null)
  assert.equal(readSession(null), null)
})

test('после 5 ошибок вход блокируется', () => {
  const key = 'test|1'
  resetFails(key)
  for (let i = 0; i < MAX_FAILS - 1; i += 1) registerFail(key, 1000)
  assert.equal(lockedFor(key, 1000), 0)
  registerFail(key, 1000)
  assert.ok(lockedFor(key, 1000) > 0)
})

test('блокировка снимается через 15 минут', () => {
  const key = 'test|2'
  resetFails(key)
  for (let i = 0; i < MAX_FAILS; i += 1) registerFail(key, 1000)
  assert.equal(lockedFor(key, 1000 + WINDOW_MS + 1), 0)
})

test('успешный вход сбрасывает счётчик', () => {
  const key = 'test|3'
  for (let i = 0; i < MAX_FAILS; i += 1) registerFail(key, 1000)
  resetFails(key)
  assert.equal(lockedFor(key, 1000), 0)
})
