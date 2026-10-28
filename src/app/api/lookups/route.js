import { json, fail } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { listLookups } from '@/lib/repo'

export async function GET() {
  try {
    const user = await requireUser()
    return json(listLookups(user))
  } catch (err) {
    return fail(err)
  }
}
