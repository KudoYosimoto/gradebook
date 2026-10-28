import { json, fail, requireRole, httpError } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { ranking, sheet, studentCard } from '@/lib/repo'

export async function GET(req) {
  try {
    const user = await requireUser()
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'ranking'

    if (type === 'student') {
      const studentId = url.searchParams.get('studentId')
      if (user.role === 'student') {
        if (String(user.studentId) !== String(studentId)) throw httpError(403, 'Можно смотреть только свои оценки')
      } else {
        requireRole(user, ['admin', 'dean', 'teacher'])
      }
      return json(studentCard(studentId))
    }

    requireRole(user, ['admin', 'dean', 'teacher'])
    if (type === 'sheet') {
      return json(sheet(url.searchParams.get('assignmentId'), user))
    }
    const rows = ranking(url.searchParams.get('groupId'), url.searchParams.get('semesterId'))
    if (type === 'debts') return json(rows.filter((row) => row.debts > 0))
    if (type === 'quality') return json(rows.filter((row) => row.quality))
    if (type === 'ranking') return json(rows)
    throw httpError(400, 'Неизвестный тип отчёта')
  } catch (err) {
    return fail(err)
  }
}
