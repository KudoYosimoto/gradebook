import { json, fail, requireRole, httpError } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { listJournal, saveJournal, writeAudit } from '@/lib/repo'

export async function GET(req) {
  try {
    const user = await requireUser()
    requireRole(user, ['admin', 'teacher'])
    const assignmentId = new URL(req.url).searchParams.get('assignmentId')
    if (!assignmentId) throw httpError(400, 'Нужен assignmentId')
    return json(listJournal(assignmentId, user))
  } catch (err) {
    return fail(err)
  }
}

export async function PUT(req) {
  try {
    const user = await requireUser()
    requireRole(user, ['admin', 'teacher'])
    const { assignmentId, rows } = await req.json()
    if (!assignmentId) throw httpError(400, 'Нужен assignmentId')
    const data = saveJournal(assignmentId, rows, user)
    writeAudit(user, 'Оценка', 'Изменение', `${data.assignment.discipline}, ${data.assignment.group}`)
    return json(data)
  } catch (err) {
    return fail(err)
  }
}
