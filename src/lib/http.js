/** Успешный JSON-ответ. */
export function json(data, status = 200) {
  return Response.json(data, { status })
}

/**
 * Ответ с ошибкой. Если ошибка «наша» (есть status) — показываем текст пользователю.
 * Если неожиданная — пишем подробности в консоль сервера, а наружу отдаём только «Ошибка сервера»
 */
export function fail(err) {
  if (err instanceof SyntaxError) {
    return Response.json({ error: 'Некорректный JSON в запросе' }, { status: 400 })
  }
  const status = err.status || 500
  const message = err.status ? err.message : 'Ошибка сервера'
  if (!err.status) console.error(err)
  return Response.json({ error: message }, { status })
}

export function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

/** Роль пользователя должна быть в списке, иначе 403. Это главная серверная проверка прав. */
export function requireRole(user, roles) {
  if (!roles.includes(user.role)) {
    throw httpError(403, 'Недостаточно прав для этого действия')
  }
}

/** Проверка обязательных текстовых полей формы: пустые строки не пропускаем. */
export function requireFields(body, fields) {
  for (const [key, label] of Object.entries(fields)) {
    const value = body?.[key]
    if (value == null || String(value).trim() === '') {
      throw httpError(400, `Заполните поле «${label}»`)
    }
  }
}

/** Значение должно быть одним из разрешённых (роль, статус, форма контроля...). */
export function requireOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw httpError(400, `Недопустимое значение поля «${label}»`)
  }
}

/** Целое число в диапазоне или null, если поле пустое и необязательное. */
export function toInt(value, label, { min = 0, max = 100000, optional = false } = {}) {
  if (value === '' || value == null) {
    if (optional) return null
    throw httpError(400, `Заполните поле «${label}»`)
  }
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) {
    throw httpError(400, `Поле «${label}»: целое число от ${min} до ${max}`)
  }
  return n
}

/**
 * Переводит технические ошибки SQLite в понятные сообщения.
 * Ограничения (UNIQUE, FOREIGN KEY, CHECK) описаны в db/schema.sql — база сама не даёт записать мусор.
 */
export function explainSqlite(err) {
  const msg = String(err.message || err)
  if (msg.includes('UNIQUE') && msg.includes('assignments')) {
    return httpError(409, 'Такое назначение уже есть: семестр, группа и дисциплина заняты')
  }
  if (msg.includes('UNIQUE') && msg.includes('users.login')) {
    return httpError(409, 'Логин уже занят')
  }
  if (msg.includes('UNIQUE') && msg.includes('groups.name')) {
    return httpError(409, 'Группа с таким названием уже есть')
  }
  if (msg.includes('FOREIGN KEY')) {
    return httpError(409, 'Операция нарушает связи: на запись ссылаются другие данные или выбранная запись не существует')
  }
  if (msg.includes('CHECK')) {
    return httpError(400, 'Недопустимое значение одного из полей')
  }
  if (msg.includes('UNIQUE')) {
    return httpError(409, 'Запись с такими данными уже существует')
  }
  return err
}
