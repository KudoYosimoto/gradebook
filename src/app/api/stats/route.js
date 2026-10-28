import { json, fail, requireRole } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { stats } from '@/lib/repo'

export async function GET() {
  try {
    const user = await requireUser()
    requireRole(user, ['admin', 'dean'])
    return json(stats())
  } catch (err) {
    return fail(err)
  }
}
