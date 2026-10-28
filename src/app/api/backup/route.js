import { json, fail, requireRole, httpError } from '@/lib/http'
import { requireUser } from '@/lib/auth-server'
import { writeAudit } from '@/lib/repo'
import { replaceDb, snapshotDb } from '@/lib/db'

const MAX_SIZE = 50 * 1024 * 1024 // 50 МБ

export async function GET() {
  try {
    const user = await requireUser()
    requireRole(user, ['admin'])
    const bytes = snapshotDb()
    writeAudit(user, 'База данных', 'Выгрузка', 'gradebook.db')
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="gradebook.db"',
      },
    })
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req) {
  try {
    const user = await requireUser()
    requireRole(user, ['admin'])
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') throw httpError(400, 'Нужен файл .db')
    if (file.size > MAX_SIZE) throw httpError(413, 'Файл больше 50 МБ')
    const bytes = Buffer.from(await file.arrayBuffer())
    // Каждый файл SQLite начинается с подписи "SQLite format 3" — чужой файл не примем.
    if (bytes.subarray(0, 15).toString() !== 'SQLite format 3') {
      throw httpError(400, 'Это не файл SQLite')
    }
    if (!replaceDb(bytes)) throw httpError(400, 'Файл базы повреждён')
    writeAudit(user, 'База данных', 'Восстановление', file.name || 'upload.db')
    return json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
