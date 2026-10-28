import { json, fail } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { writeAudit } from '@/lib/repo'
import { clearSessionCookie } from '@/lib/session'

export async function POST() {
  try {
    const user = await requireUser().catch(() => null)
    if (user) writeAudit(user, 'Сессия', 'Выход', user.login)
    await clearSessionCookie()
    return json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
