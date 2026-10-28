import { json, fail, requireRole, httpError } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { studentCard } from '@/lib/repo'

export async function GET() {
  try {
    const user = await requireUser()
    requireRole(user, ['student'])
    if (!user.studentId) throw httpError(400, 'К учётной записи не привязан студент')
    return json(studentCard(user.studentId))
  } catch (err) {
    return fail(err)
  }
}
