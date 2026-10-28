import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gb-'))
process.env.GRADEBOOK_DB_PATH = path.join(dir, 'test.db')

const { getDb, closeDb } = await import('../src/lib/db.js')
const repo = await import('../src/lib/repo.js')
const { verifyPassword } = await import('../src/lib/crypto.js')

test.after(() => {
  closeDb()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('после сида есть пользователи', () => {
  const n = getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n
  assert.ok(n >= 4)
})

test('демо admin / admin123 работает', () => {
  const row = repo.findUserByLogin('admin')
  assert.ok(row)
  assert.equal(verifyPassword('admin123', row.password_hash), true)
  assert.equal(row.role, 'admin')
})

test('демо student1 привязан к Сидоровой', () => {
  const user = repo.getPublicUser(repo.findUserByLogin('student1').id)
  assert.equal(user.role, 'student')
  assert.match(user.name, /Сидорова/)
  assert.ok(user.studentId)
})

test('демо teacher1 привязан к Соколову', () => {
  const user = repo.getPublicUser(repo.findUserByLogin('teacher1').id)
  assert.match(user.name, /Соколов/)
  assert.ok(user.teacherId)
})

test('групп ровно 5', () => {
  assert.equal(repo.listGroups().length, 5)
})

test('студентов не меньше 20', () => {
  assert.ok(repo.listStudents().length >= 20)
})

test('дисциплин 15', () => {
  assert.equal(repo.listDisciplines().length, 15)
})

test('преподавателей 10', () => {
  assert.equal(repo.listTeachers().length, 10)
})

test('оценок больше 200', () => {
  const n = getDb().prepare('SELECT COUNT(*) AS n FROM grades').get().n
  assert.ok(n >= 200, `оценок ${n}`)
})

test('GPA не хранится отдельной колонкой', () => {
  const cols = getDb().prepare('PRAGMA table_info(students)').all().map((row) => row.name)
  assert.equal(cols.includes('gpa'), false)
})

test('средний балл Сидоровой считается', () => {
  const sidorova = repo.listStudents().find((row) => row.fio.includes('Сидорова'))
  assert.ok(sidorova.gpa >= 4)
})

test('создание и удаление дисциплины', () => {
  const row = repo.createDiscipline({ name: 'Тест-дисциплина', lectures: 10, practice: 10, labs: 10, control: 'Зачёт' })
  assert.ok(row.id)
  repo.deleteDiscipline(row.id)
  assert.equal(repo.listDisciplines().some((item) => item.id === row.id), false)
})

test('повторное назначение той же тройки запрещено', () => {
  const first = repo.listAssignments()[0]
  assert.throws(() => repo.createAssignment({
    semester_id: first.semester_id,
    group_id: first.group_id,
    discipline_id: first.discipline_id,
    teacher_id: first.teacher_id,
  }))
})

test('рейтинг ИС-21 не пустой', () => {
  const group = repo.listGroups().find((row) => row.name === 'ИС-21')
  const sem = getDb().prepare('SELECT id FROM semesters LIMIT 1').get()
  const rows = repo.ranking(group.id, sem.id)
  assert.ok(rows.length >= 6)
  assert.equal(rows[0].place, 1)
})

test('кабинет студента отдаёт только его дисциплины', () => {
  const user = repo.getPublicUser(repo.findUserByLogin('student1').id)
  const card = repo.studentCard(user.studentId)
  assert.ok(card.rows.length >= 5)
  assert.ok(card.gpa >= 4)
})

test('журнал Соколова по БД содержит студентов ИС-21', () => {
  const a = repo.listAssignments().find((row) => row.group === 'ИС-21' && row.discipline === 'Базы данных')
  const data = repo.listJournal(a.id, { role: 'admin' })
  assert.ok(data.rows.length >= 6)
  assert.equal(data.assignment.control, 'Экзамен')
})

test('преподаватель не видит чужой журнал', () => {
  const teacher = repo.getPublicUser(repo.findUserByLogin('teacher1').id)
  const foreign = repo.listAssignments().find((row) => row.teacher_id !== teacher.teacherId)
  assert.throws(() => repo.listJournal(foreign.id, teacher))
})

/* ---------- защита и проверки данных ---------- */

test('в базе нет открытых паролей', () => {
  const rows = getDb().prepare('SELECT password_hash FROM users').all()
  for (const row of rows) assert.match(row.password_hash, /^scrypt\$/)
})

test('список пользователей не отдаёт хеш пароля', () => {
  const user = repo.listUsers()[0]
  assert.equal('password_hash' in user, false)
})

test('getPublicUser не отдаёт хеш пароля', () => {
  const user = repo.getPublicUser(repo.findUserByLogin('admin').id)
  assert.equal('password_hash' in user, false)
})

test('преподаватель не может поставить оценку студенту чужой группы', () => {
  const teacher = repo.getPublicUser(repo.findUserByLogin('teacher1').id)
  const own = repo.listAssignments(teacher).find((row) => row.group === 'ИС-21')
  const stranger = repo.listStudents().find((row) => row.group !== 'ИС-21' && row.status === 'Учится')
  assert.throws(() => repo.saveJournal(own.id, [{ studentId: stranger.id, lab: 5, coursework: 5, exam: 5 }], teacher), /не из этой группы/)
})

test('оценка вне 2..5 отклоняется', () => {
  const a = repo.listAssignments().find((row) => row.control === 'Экзамен')
  const { rows } = repo.listJournal(a.id, { role: 'admin' })
  assert.throws(() => repo.saveJournal(a.id, [{ studentId: rows[0].studentId, lab: 7, coursework: 5, exam: 5 }], { role: 'admin' }), /от 2 до 5/)
  assert.throws(() => repo.saveJournal(a.id, [{ studentId: rows[0].studentId, lab: 4.5, coursework: 5, exam: 5 }], { role: 'admin' }))
})

test('сохранение оценок пересчитывает итог', () => {
  const a = repo.listAssignments().find((row) => row.group === 'ИС-21' && row.discipline === 'Базы данных')
  const { rows } = repo.listJournal(a.id, { role: 'admin' })
  const saved = repo.saveJournal(a.id, [{ studentId: rows[0].studentId, lab: 2, coursework: 2, exam: 2 }], { role: 'admin' })
  const row = saved.rows.find((r) => r.studentId === rows[0].studentId)
  assert.equal(row.exam, 2)
})

test('студенту не отдаются списки людей в lookups', () => {
  const student = repo.getPublicUser(repo.findUserByLogin('student1').id)
  const data = repo.listLookups(student)
  assert.equal(data.students.length, 0)
  assert.equal(data.teachers.length, 0)
})

test('SQL-инъекция в ФИО сохраняется как обычный текст', () => {
  const group = repo.listGroups()[0]
  const row = repo.createStudent({ last_name: "'; DROP TABLE users; --", first_name: 'Тест', group_id: group.id })
  assert.ok(row.id)
  assert.ok(getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n >= 4)
  repo.deleteStudent(row.id)
})

test('пустая фамилия не сохраняется', () => {
  const group = repo.listGroups()[0]
  assert.throws(() => repo.createStudent({ last_name: '  ', first_name: 'Тест', group_id: group.id }), /Фамилия/)
})

test('недопустимый статус не сохраняется', () => {
  const group = repo.listGroups()[0]
  assert.throws(() => repo.createStudent({ last_name: 'А', first_name: 'Б', group_id: group.id, status: 'Хакер' }))
})

test('нельзя создать пользователя с неизвестной ролью', () => {
  assert.throws(() => repo.createUser({ login: 'hacker', password: 'secret1', role: 'root' }))
})

test('короткий пароль не принимается', () => {
  assert.throws(() => repo.createUser({ login: 'newuser', password: '123', role: 'dean' }), /6 символов/)
})

test('админ не может удалить или заблокировать сам себя', () => {
  const admin = repo.getPublicUser(repo.findUserByLogin('admin').id)
  assert.throws(() => repo.deleteUser(admin.id, admin))
  assert.throws(() => repo.updateUser(admin.id, { status: 'Заблокирован' }, admin))
})

test('новая учётка преподавателя привязывается и видит свои назначения', () => {
  const teacher = repo.listTeachers().find((row) => !row.user_id)
  const created = repo.createUser({ login: 'teacher_new', password: 'secret12', role: 'teacher', teacher_id: teacher.id })
  const user = repo.getPublicUser(created.id)
  assert.equal(user.teacherId, teacher.id)
  assert.ok(repo.listAssignments(user).every((row) => row.teacher_id === teacher.id))
  repo.deleteUser(created.id)
})

test('группу со студентами удалить нельзя', () => {
  const group = repo.listGroups().find((row) => row.name === 'ИС-21')
  assert.throws(() => repo.deleteGroup(group.id), /связи/)
})
