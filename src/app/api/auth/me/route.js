import { json, fail } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'

export async function GET() {
  try {
    const user = await requireUser()
    return json({ user })
  } catch (err) {
    return fail(err)
  }
}
