import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { seedDatabase } from './seed.js'

const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql')

/** Путь к файлу базы. В тестах подменяется переменной GRADEBOOK_DB_PATH на временный файл. */
export function dbPath() {
  return process.env.GRADEBOOK_DB_PATH || path.join(process.cwd(), 'data', 'gradebook.db')
}

// Одно соединение на весь процесс
let cached = null
let cachedPath = null

export function getDb() {
  const file = dbPath()
  if (cached && cachedPath === file) return cached
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  if (count === 0) seedDatabase(db)
  cached = db
  cachedPath = file
  return db
}

export function closeDb() {
  if (cached) {
    cached.close()
    cached = null
    cachedPath = null
  }
}

export function snapshotDb() {
  const tmp = path.join(path.dirname(dbPath()), `backup-${Date.now()}.db`)
  getDb().prepare('VACUUM INTO ?').run(tmp)
  const bytes = fs.readFileSync(tmp)
  fs.unlinkSync(tmp)
  return bytes
}

export function replaceDb(bytes) {
  closeDb()
  const file = dbPath()
  for (const extra of [`${file}-wal`, `${file}-shm`]) {
    if (fs.existsSync(extra)) fs.unlinkSync(extra)
  }
  fs.writeFileSync(file, bytes)
  // Открываем заново и проверяем, что файл — рабочая база с нужными таблицами.
  const db = getDb()
  const ok = db.prepare('PRAGMA integrity_check').get()
  return Object.values(ok)[0] === 'ok'
}
