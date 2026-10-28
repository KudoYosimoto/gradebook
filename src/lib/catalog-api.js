import { CATALOG, writeAudit } from '@/lib/repo'
import { requireUser } from '@/lib/auth-server'
import { json, fail, requireRole, httpError } from '@/lib/http'

// Как сущность называется в журнале действий.
const LABELS = {
  students: 'Студент',
  groups: 'Группа',
  teachers: 'Преподаватель',
  disciplines: 'Дисциплина',
  assignments: 'Назначение',
  users: 'Пользователь',
}

/** GET /api/<ресурс> — список, POST /api/<ресурс> — создание. */
export function collectionHandlers(resource) {
  const spec = CATALOG[resource]
  return {
    async GET() {
      try {
        const user = await requireUser()
        requireRole(user, spec.read)
        return json(spec.list(user))
      } catch (err) {
        return fail(err)
      }
    },
    async POST(req) {
      try {
        const user = await requireUser()
        requireRole(user, spec.write)
        const body = await req.json()
        const row = spec.create(body, user)
        writeAudit(user, LABELS[resource], 'Создание', `id=${row?.id}`)
        return json(row, 201)
      } catch (err) {
        return fail(err)
      }
    },
  }
}

/** PUT /api/<ресурс>/<id> — изменение, DELETE /api/<ресурс>/<id> — удаление. */
export function itemHandlers(resource) {
  const spec = CATALOG[resource]
  return {
    async PUT(req, ctx) {
      try {
        const user = await requireUser()
        requireRole(user, spec.write)
        const { id } = await ctx.params
        const body = await req.json()
        const row = spec.update(id, body, user)
        if (!row) throw httpError(404, 'Запись не найдена')
        writeAudit(user, LABELS[resource], 'Изменение', `id=${id}`)
        return json(row)
      } catch (err) {
        return fail(err)
      }
    },
    async DELETE(_req, ctx) {
      try {
        const user = await requireUser()
        requireRole(user, spec.write)
        const { id } = await ctx.params
        spec.remove(id, user)
        writeAudit(user, LABELS[resource], 'Удаление', `id=${id}`)
        return json({ ok: true })
      } catch (err) {
        return fail(err)
      }
    },
  }
}
