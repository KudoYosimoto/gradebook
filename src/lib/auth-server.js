import { getSessionUserId } from './session.js'
import { getPublicUser } from './repo.js'
import { httpError } from './http.js'

export async function requireUser() {
  const uid = await getSessionUserId()
  if (!uid) throw httpError(401, 'Нужна авторизация')
  const user = getPublicUser(uid)
  if (!user || user.status !== 'Активен') throw httpError(401, 'Нужна авторизация')
  return user
}
