import { json, fail, requireRole } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { listAudit } from '@/lib/repo'

export async function GET() {
  try {
    const user = await requireUser()
    requireRole(user, ['admin'])
    return json(listAudit())
  } catch (err) {
    return fail(err)
  }
}
