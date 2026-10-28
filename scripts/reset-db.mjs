import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dbFile = path.join(root, 'data', 'gradebook.db')
for (const file of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) {
  if (fs.existsSync(file)) fs.unlinkSync(file)
}
process.env.GRADEBOOK_DB_PATH = dbFile
const { getDb, closeDb } = await import('../src/lib/db.js')
const db = getDb()
const grades = db.prepare('SELECT COUNT(*) AS n FROM grades').get().n
const students = db.prepare('SELECT COUNT(*) AS n FROM students').get().n
console.log(`База пересоздана: студентов ${students}, оценок ${grades}`)
closeDb()
