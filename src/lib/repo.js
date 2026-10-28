import { getDb } from './db.js'
import { hashPassword } from './crypto.js'
import { httpError, explainSqlite, requireFields, requireOneOf, toInt } from './http.js'
import { calcFinalGrade, isPassed } from './grades.js'

export const ROLES = ['admin', 'dean', 'teacher', 'student']
const STUDY_FORMS = ['Очная', 'Очно-заочная', 'Заочная']
const STUDENT_STATUSES = ['Учится', 'Академ. отпуск', 'Отчислен']
const CONTROLS = ['Экзамен', 'Зачёт', 'Диф. зачёт']
const USER_STATUSES = ['Активен', 'Заблокирован']

const GPA_SQL = `
  SELECT ROUND(AVG(gr.lab * 0.3 + gr.coursework * 0.3 + gr.exam * 0.4), 2)
  FROM grades gr
  JOIN assignments a ON a.id = gr.assignment_id
  JOIN disciplines d ON d.id = a.discipline_id
  WHERE gr.student_id = s.id
    AND d.control IN ('Экзамен', 'Диф. зачёт')
    AND gr.lab IS NOT NULL AND gr.coursework IS NOT NULL AND gr.exam IS NOT NULL
`

const SHORT_TEACHER = `
  t.last_name || ' ' || SUBSTR(t.first_name,1,1) || '.' ||
  CASE WHEN t.middle_name IS NULL OR t.middle_name = '' THEN '' ELSE SUBSTR(t.middle_name,1,1) || '.' END
`

function fio(row) {
  return [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ')
}

function shortOf(name) {
  return name?.trim()?.[0]?.toUpperCase() || '?'
}

function text(value) {
  return String(value ?? '').trim()
}

/** Выполнить запись и превратить ошибку SQLite в понятное сообщение. */
function runWrite(fn) {
  try {
    return fn()
  } catch (err) {
    throw explainSqlite(err)
  }
}

/* ============================ ПОЛЬЗОВАТЕЛЬ СЕССИИ ============================ */

/**
 * Данные вошедшего пользователя, которые можно отдать в браузер.
 * password_hash сюда НЕ попадает никогда.
 * teacherId / studentId нужны для проверок «только своё».
 */
export function getPublicUser(id) {
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) return null
  const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(id)
  const student = db.prepare(`
    SELECT s.*, g.name AS group_name
    FROM students s
    JOIN groups g ON g.id = s.group_id
    WHERE s.user_id = ?
  `).get(id)
  const name = teacher ? fio(teacher) : student ? fio(student) : user.display_name
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    name,
    short: shortOf(name),
    status: user.status,
    teacherId: teacher?.id ?? null,
    studentId: student?.id ?? null,
    groupName: student?.group_name ?? null,
    groupId: student?.group_id ?? null,
  }
}

export function findUserByLogin(login) {
  return getDb().prepare('SELECT * FROM users WHERE login = ?').get(login)
}

/**
 * Запись в журнал действий. Если записать не удалось (например, после восстановления базы
 * пользователя с таким id уже нет) — пишем без автора, но основное действие не ломаем.
 */
export function writeAudit(user, entity, action, details = '') {
  const insert = getDb().prepare(`
    INSERT INTO audit_log (user_id, entity, action, details)
    VALUES (?, ?, ?, ?)
  `)
  try {
    insert.run(user?.id ?? null, entity, action, details)
  } catch {
    insert.run(null, entity, action, `${user?.login ?? ''} ${details}`.trim())
  }
}

/* ============================ СПИСКИ ДЛЯ ВЫПАДАЮЩИХ МЕНЮ ============================ */

/**
 * Справочники для select в модалках и фильтрах.
 * Студенту список всех студентов НЕ отдаём.
 */
export function listLookups(user) {
  const db = getDb()
  const base = {
    groups: db.prepare('SELECT id, name FROM groups ORDER BY name').all(),
    disciplines: db.prepare('SELECT id, name, control FROM disciplines ORDER BY name').all(),
    semesters: db.prepare('SELECT id, name FROM semesters ORDER BY id DESC').all(),
  }
  if (user?.role === 'student') return { ...base, teachers: [], students: [] }
  return {
    ...base,
    teachers: db.prepare(`
      SELECT id, user_id, last_name || ' ' || first_name || ' ' || COALESCE(middle_name, '') AS fio
      FROM teachers ORDER BY last_name
    `).all(),
    students: db.prepare(`
      SELECT s.id, s.user_id, s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio,
        g.name AS group_name
      FROM students s JOIN groups g ON g.id = s.group_id
      ORDER BY s.last_name
    `).all(),
  }
}

/* ============================ СТУДЕНТЫ ============================ */

export function listStudents() {
  return getDb().prepare(`
    SELECT
      s.id, s.group_id, s.form, s.status,
      s.last_name, s.first_name, s.middle_name,
      s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio,
      g.name AS "group",
      (${GPA_SQL}) AS gpa
    FROM students s
    JOIN groups g ON g.id = s.group_id
    ORDER BY g.name, s.last_name, s.first_name
  `).all()
}

/** Проверка и нормализация формы студента (общая для создания и изменения). */
function studentParams(body) {
  requireFields(body, { last_name: 'Фамилия', first_name: 'Имя', group_id: 'Группа' })
  const form = body.form || 'Очная'
  const status = body.status || 'Учится'
  requireOneOf(form, STUDY_FORMS, 'Форма')
  requireOneOf(status, STUDENT_STATUSES, 'Статус')
  return {
    last_name: text(body.last_name),
    first_name: text(body.first_name),
    middle_name: text(body.middle_name),
    group_id: toInt(body.group_id, 'Группа', { min: 1 }),
    form,
    status,
  }
}

export function createStudent(body) {
  const params = studentParams(body)
  return runWrite(() => {
    const info = getDb().prepare(`
      INSERT INTO students (last_name, first_name, middle_name, group_id, form, status)
      VALUES (@last_name, @first_name, @middle_name, @group_id, @form, @status)
    `).run(params)
    return listStudents().find((row) => row.id === Number(info.lastInsertRowid))
  })
}

export function updateStudent(id, body) {
  const params = { ...studentParams(body), id: toInt(id, 'id', { min: 1 }) }
  return runWrite(() => {
    getDb().prepare(`
      UPDATE students SET last_name=@last_name, first_name=@first_name, middle_name=@middle_name,
        group_id=@group_id, form=@form, status=@status WHERE id=@id
    `).run(params)
    return listStudents().find((row) => row.id === params.id)
  })
}

/** Удаление студента удаляет и его оценки */
export function deleteStudent(id) {
  return runWrite(() => {
    const info = getDb().prepare('DELETE FROM students WHERE id = ?').run(toInt(id, 'id', { min: 1 }))
    if (!info.changes) throw httpError(404, 'Студент не найден')
  })
}

/* ============================ ГРУППЫ ============================ */

export function listGroups() {
  return getDb().prepare(`
    SELECT g.id, g.name, g.specialty, g.course, g.form, g.year, g.curator_id,
      CASE WHEN t.id IS NULL THEN '—' ELSE ${SHORT_TEACHER} END AS curator
    FROM groups g
    LEFT JOIN teachers t ON t.id = g.curator_id
    ORDER BY g.name
  `).all()
}

function groupParams(body) {
  requireFields(body, { name: 'Название', specialty: 'Специальность' })
  const form = body.form || 'Очная'
  requireOneOf(form, STUDY_FORMS, 'Форма')
  return {
    name: text(body.name),
    specialty: text(body.specialty),
    course: toInt(body.course, 'Курс', { min: 1, max: 6 }),
    form,
    year: toInt(body.year, 'Год набора', { min: 2000, max: 2100 }),
    curator_id: toInt(body.curator_id, 'Куратор', { min: 1, optional: true }),
  }
}

export function createGroup(body) {
  const params = groupParams(body)
  return runWrite(() => {
    const info = getDb().prepare(`
      INSERT INTO groups (name, specialty, course, form, year, curator_id)
      VALUES (@name, @specialty, @course, @form, @year, @curator_id)
    `).run(params)
    return listGroups().find((row) => row.id === Number(info.lastInsertRowid))
  })
}

export function updateGroup(id, body) {
  const params = { ...groupParams(body), id: toInt(id, 'id', { min: 1 }) }
  return runWrite(() => {
    getDb().prepare(`
      UPDATE groups SET name=@name, specialty=@specialty, course=@course, form=@form, year=@year, curator_id=@curator_id
      WHERE id=@id
    `).run(params)
    return listGroups().find((row) => row.id === params.id)
  })
}

/** Группу со студентами или назначениями удалить нельзя — не даст внешний ключ. */
export function deleteGroup(id) {
  return runWrite(() => {
    const info = getDb().prepare('DELETE FROM groups WHERE id = ?').run(toInt(id, 'id', { min: 1 }))
    if (!info.changes) throw httpError(404, 'Группа не найдена')
  })
}

/* ============================ ПРЕПОДАВАТЕЛИ ============================ */

export function listTeachers() {
  return getDb().prepare(`
    SELECT id, user_id, last_name, first_name, middle_name, dept, title, degree, email,
      last_name || ' ' || first_name || ' ' || COALESCE(middle_name, '') AS fio
    FROM teachers
    ORDER BY last_name, first_name
  `).all()
}

function teacherParams(body) {
  requireFields(body, { last_name: 'Фамилия', first_name: 'Имя', dept: 'Кафедра', title: 'Должность' })
  const email = text(body.email)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Некорректный email')
  return {
    last_name: text(body.last_name),
    first_name: text(body.first_name),
    middle_name: text(body.middle_name),
    dept: text(body.dept),
    title: text(body.title),
    degree: text(body.degree) || '—',
    email,
  }
}

export function createTeacher(body) {
  const params = teacherParams(body)
  return runWrite(() => {
    const info = getDb().prepare(`
      INSERT INTO teachers (last_name, first_name, middle_name, dept, title, degree, email)
      VALUES (@last_name, @first_name, @middle_name, @dept, @title, @degree, @email)
    `).run(params)
    return listTeachers().find((row) => row.id === Number(info.lastInsertRowid))
  })
}

export function updateTeacher(id, body) {
  const params = { ...teacherParams(body), id: toInt(id, 'id', { min: 1 }) }
  return runWrite(() => {
    getDb().prepare(`
      UPDATE teachers SET last_name=@last_name, first_name=@first_name, middle_name=@middle_name,
        dept=@dept, title=@title, degree=@degree, email=@email WHERE id=@id
    `).run(params)
    return listTeachers().find((row) => row.id === params.id)
  })
}

export function deleteTeacher(id) {
  return runWrite(() => {
    const info = getDb().prepare('DELETE FROM teachers WHERE id = ?').run(toInt(id, 'id', { min: 1 }))
    if (!info.changes) throw httpError(404, 'Преподаватель не найден')
  })
}

/* ============================ ДИСЦИПЛИНЫ ============================ */

export function listDisciplines() {
  return getDb().prepare('SELECT * FROM disciplines ORDER BY name').all()
}

function disciplineParams(body) {
  requireFields(body, { name: 'Название' })
  const control = body.control || 'Экзамен'
  requireOneOf(control, CONTROLS, 'Форма контроля')
  return {
    name: text(body.name),
    lectures: toInt(body.lectures, 'Лекции', { optional: true, max: 1000 }),
    practice: toInt(body.practice, 'Практики', { optional: true, max: 1000 }),
    labs: toInt(body.labs, 'Лабораторные', { optional: true, max: 1000 }),
    control,
  }
}

export function createDiscipline(body) {
  const params = disciplineParams(body)
  return runWrite(() => {
    const info = getDb().prepare(`
      INSERT INTO disciplines (name, lectures, practice, labs, control)
      VALUES (@name, @lectures, @practice, @labs, @control)
    `).run(params)
    return listDisciplines().find((row) => row.id === Number(info.lastInsertRowid))
  })
}

export function updateDiscipline(id, body) {
  const params = { ...disciplineParams(body), id: toInt(id, 'id', { min: 1 }) }
  return runWrite(() => {
    getDb().prepare(`
      UPDATE disciplines SET name=@name, lectures=@lectures, practice=@practice, labs=@labs, control=@control
      WHERE id=@id
    `).run(params)
    return listDisciplines().find((row) => row.id === params.id)
  })
}

export function deleteDiscipline(id) {
  return runWrite(() => {
    const info = getDb().prepare('DELETE FROM disciplines WHERE id = ?').run(toInt(id, 'id', { min: 1 }))
    if (!info.changes) throw httpError(404, 'Дисциплина не найдена')
  })
}

/* ============================ НАЗНАЧЕНИЯ ============================ */

/**
 * Назначение = семестр + группа + дисциплина + преподаватель.
 * Преподаватель получает только СВОИ назначения — чужие журналы ему даже не показываются.
 */
export function listAssignments(user) {
  const rows = getDb().prepare(`
    SELECT a.id, a.semester_id, a.group_id, a.discipline_id, a.teacher_id,
      sem.name AS semester, g.name AS "group", d.name AS discipline, d.control,
      ${SHORT_TEACHER} AS teacher
    FROM assignments a
    JOIN semesters sem ON sem.id = a.semester_id
    JOIN groups g ON g.id = a.group_id
    JOIN disciplines d ON d.id = a.discipline_id
    JOIN teachers t ON t.id = a.teacher_id
    ORDER BY sem.id DESC, g.name, d.name
  `).all()
  if (user?.role === 'teacher') return rows.filter((row) => row.teacher_id === user.teacherId)
  return rows
}

function assignmentParams(body) {
  return {
    semester_id: toInt(body.semester_id, 'Семестр', { min: 1 }),
    group_id: toInt(body.group_id, 'Группа', { min: 1 }),
    discipline_id: toInt(body.discipline_id, 'Дисциплина', { min: 1 }),
    teacher_id: toInt(body.teacher_id, 'Преподаватель', { min: 1 }),
  }
}

export function createAssignment(body) {
  const params = assignmentParams(body)
  return runWrite(() => {
    const info = getDb().prepare(`
      INSERT INTO assignments (semester_id, group_id, discipline_id, teacher_id)
      VALUES (@semester_id, @group_id, @discipline_id, @teacher_id)
    `).run(params)
    return listAssignments().find((row) => row.id === Number(info.lastInsertRowid))
  })
}

export function updateAssignment(id, body) {
  const params = { ...assignmentParams(body), id: toInt(id, 'id', { min: 1 }) }
  return runWrite(() => {
    getDb().prepare(`
      UPDATE assignments SET semester_id=@semester_id, group_id=@group_id, discipline_id=@discipline_id, teacher_id=@teacher_id
      WHERE id=@id
    `).run(params)
    return listAssignments().find((row) => row.id === params.id)
  })
}

/** Удаление назначения удаляет и оценки по нему (CASCADE). Интерфейс переспрашивает. */
export function deleteAssignment(id) {
  return runWrite(() => {
    const info = getDb().prepare('DELETE FROM assignments WHERE id = ?').run(toInt(id, 'id', { min: 1 }))
    if (!info.changes) throw httpError(404, 'Назначение не найдено')
  })
}

/* ============================ УЧЁТНЫЕ ЗАПИСИ ============================ */

/** Список пользователей для админа. Хеш пароля не выбираем. */
export function listUsers() {
  return getDb().prepare(`
    SELECT u.id, u.login, u.role, u.display_name AS name, u.status, u.created_at,
      (SELECT id FROM teachers WHERE user_id = u.id) AS teacher_id,
      (SELECT id FROM students WHERE user_id = u.id) AS student_id
    FROM users u
    ORDER BY u.role, u.login
  `).all()
}

/**
 * Привязка учётки к человеку: логин преподавателя → запись в teachers, студента → в students.
 * Без привязки преподаватель войдёт, но не увидит своих журналов.
 */
function linkPerson(userId, role, body) {
  const db = getDb()
  db.prepare('UPDATE teachers SET user_id = NULL WHERE user_id = ?').run(userId)
  db.prepare('UPDATE students SET user_id = NULL WHERE user_id = ?').run(userId)
  if (role === 'teacher' && body.teacher_id) {
    db.prepare('UPDATE teachers SET user_id = ? WHERE id = ?').run(userId, toInt(body.teacher_id, 'Преподаватель', { min: 1 }))
  }
  if (role === 'student' && body.student_id) {
    db.prepare('UPDATE students SET user_id = ? WHERE id = ?').run(userId, toInt(body.student_id, 'Студент', { min: 1 }))
  }
}

function checkPassword(password) {
  if (String(password).length < 6) throw httpError(400, 'Пароль не короче 6 символов')
}

export function createUser(body) {
  requireFields(body, { login: 'Логин', password: 'Пароль' })
  checkPassword(body.password)
  const role = body.role || 'dean'
  const status = body.status || 'Активен'
  requireOneOf(role, ROLES, 'Роль')
  requireOneOf(status, USER_STATUSES, 'Статус')
  const login = text(body.login)
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(login)) {
    throw httpError(400, 'Логин: 3–32 символа, латиница, цифры, точка, дефис, подчёркивание')
  }
  const tx = getDb().transaction(() => {
    const info = getDb().prepare(`
      INSERT INTO users (login, password_hash, role, display_name, status)
      VALUES (@login, @password_hash, @role, @display_name, @status)
    `).run({
      login,
      password_hash: hashPassword(body.password),
      role,
      display_name: text(body.name) || login,
      status,
    })
    const id = Number(info.lastInsertRowid)
    linkPerson(id, role, body)
    return id
  })
  const id = runWrite(() => tx())
  return listUsers().find((row) => row.id === id)
}

/**
 * Изменение учётки. Пустой пароль — пароль не меняется.
 * Нельзя заблокировать себя или снять с себя роль администратора — иначе можно остаться без доступа.
 */
export function updateUser(id, body, actor) {
  const userId = toInt(id, 'id', { min: 1 })
  const current = getDb().prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!current) throw httpError(404, 'Пользователь не найден')
  const role = body.role || current.role
  const status = body.status || current.status
  requireOneOf(role, ROLES, 'Роль')
  requireOneOf(status, USER_STATUSES, 'Статус')
  if (actor?.id === userId && (role !== 'admin' || status !== 'Активен')) {
    throw httpError(400, 'Нельзя заблокировать себя или снять с себя роль администратора')
  }
  if (body.password) checkPassword(body.password)
  const login = text(body.login) || current.login
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(login)) {
    throw httpError(400, 'Логин: 3–32 символа, латиница, цифры, точка, дефис, подчёркивание')
  }
  const tx = getDb().transaction(() => {
    getDb().prepare(`
      UPDATE users SET login=@login, password_hash=@password_hash, role=@role, display_name=@display_name, status=@status
      WHERE id=@id
    `).run({
      id: userId,
      login,
      password_hash: body.password ? hashPassword(body.password) : current.password_hash,
      role,
      display_name: text(body.name) || current.display_name,
      status,
    })
    linkPerson(userId, role, body)
  })
  runWrite(() => tx())
  return listUsers().find((row) => row.id === userId)
}

export function deleteUser(id, actor) {
  const userId = toInt(id, 'id', { min: 1 })
  if (actor?.id === userId) throw httpError(400, 'Нельзя удалить собственную учётную запись')
  return runWrite(() => {
    const info = getDb().prepare('DELETE FROM users WHERE id = ?').run(userId)
    if (!info.changes) throw httpError(404, 'Пользователь не найден')
  })
}

/* ============================ ЖУРНАЛ ОЦЕНОК ============================ */

function getAssignment(id) {
  return getDb().prepare(`
    SELECT a.*, d.control, d.name AS discipline, g.name AS group_name, sem.name AS semester
    FROM assignments a
    JOIN disciplines d ON d.id = a.discipline_id
    JOIN groups g ON g.id = a.group_id
    JOIN semesters sem ON sem.id = a.semester_id
    WHERE a.id = ?
  `).get(toInt(id, 'assignmentId', { min: 1 }))
}

/** Преподаватель работает только со своими назначениями. Админ — со всеми. */
function assertOwnAssignment(assignment, user) {
  if (!assignment) throw httpError(404, 'Назначение не найдено')
  if (user.role === 'teacher' && assignment.teacher_id !== user.teacherId) {
    throw httpError(403, 'Это не ваша дисциплина')
  }
}

/** Журнал: все учащиеся группы + их оценки по назначению (пустые, если ещё не выставлены). */
export function listJournal(assignmentId, user) {
  const assignment = getAssignment(assignmentId)
  assertOwnAssignment(assignment, user)
  const students = getDb().prepare(`
    SELECT id, last_name || ' ' || first_name || ' ' || COALESCE(middle_name, '') AS fio, status
    FROM students
    WHERE group_id = ? AND status = 'Учится'
    ORDER BY last_name, first_name
  `).all(assignment.group_id)
  const grades = getDb().prepare('SELECT * FROM grades WHERE assignment_id = ?').all(assignment.id)
  const byStudent = Object.fromEntries(grades.map((row) => [row.student_id, row]))
  return {
    assignment: {
      id: assignment.id,
      semester: assignment.semester,
      group: assignment.group_name,
      discipline: assignment.discipline,
      control: assignment.control,
    },
    rows: students.map((s) => {
      const g = byStudent[s.id] || {}
      return {
        id: s.id,
        studentId: s.id,
        fio: s.fio,
        lab: g.lab ?? '',
        coursework: g.coursework ?? '',
        exam: g.exam ?? '',
      }
    }),
  }
}

/** Оценка — целое 2..5 или пусто. Для зачёта лаб. и КР не хранятся. */
function gradeValue(value, control, field) {
  if (value === '' || value == null) return null
  if (control === 'Зачёт' && field !== 'exam') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 2 || n > 5) throw httpError(400, 'Оценка — целое число от 2 до 5')
  return n
}

/**
 * Сохранение журнала. Проверки:
 * 1) это назначение данного преподавателя;
 * 2) каждый студент из запроса действительно учится в этой группе —
 *    иначе через подделанный запрос можно было бы поставить оценку кому угодно.
 * Всё в транзакции: либо сохранились все строки, либо ни одной.
 */
export function saveJournal(assignmentId, rows, user) {
  const assignment = getAssignment(assignmentId)
  assertOwnAssignment(assignment, user)
  if (!Array.isArray(rows)) throw httpError(400, 'Нет строк журнала')
  const allowed = new Set(getDb().prepare(`
    SELECT id FROM students WHERE group_id = ? AND status = 'Учится'
  `).all(assignment.group_id).map((row) => row.id))
  const upsert = getDb().prepare(`
    INSERT INTO grades (assignment_id, student_id, lab, coursework, exam)
    VALUES (@assignment_id, @student_id, @lab, @coursework, @exam)
    ON CONFLICT(assignment_id, student_id) DO UPDATE SET
      lab = excluded.lab, coursework = excluded.coursework, exam = excluded.exam
  `)
  const tx = getDb().transaction(() => {
    for (const row of rows) {
      const studentId = Number(row.studentId)
      if (!allowed.has(studentId)) throw httpError(403, 'Студент не из этой группы')
      upsert.run({
        assignment_id: assignment.id,
        student_id: studentId,
        lab: gradeValue(row.lab, assignment.control, 'lab'),
        coursework: gradeValue(row.coursework, assignment.control, 'coursework'),
        exam: gradeValue(row.exam, assignment.control, 'exam'),
      })
    }
  })
  runWrite(() => tx())
  return listJournal(assignmentId, user)
}

/* ============================ ОТЧЁТЫ ============================ */

function examFinal(row) {
  if (row.lab == null || row.coursework == null || row.exam == null) return null
  return calcFinalGrade(row)
}

/**
 * Рейтинг группы за семестр.
 * gpa — среднее итогов по экзаменам; debts — итог < 3 или «незачтено»;
 * quality — все итоги не ниже 4 («качество знаний»).
 */
export function ranking(groupId, semesterId) {
  const db = getDb()
  const students = db.prepare(`
    SELECT s.id, s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio, s.status
    FROM students s WHERE s.group_id = ? ORDER BY s.last_name
  `).all(Number(groupId))
  const grades = db.prepare(`
    SELECT gr.*, d.control, a.group_id
    FROM grades gr
    JOIN assignments a ON a.id = gr.assignment_id
    JOIN disciplines d ON d.id = a.discipline_id
    WHERE a.group_id = ? AND a.semester_id = ?
  `).all(Number(groupId), Number(semesterId))
  const rows = students.filter((s) => s.status === 'Учится').map((s) => {
    const mine = grades.filter((g) => g.student_id === s.id)
    const exams = mine.filter((g) => g.control !== 'Зачёт')
    const finals = exams.map(examFinal).filter((v) => v != null)
    const gpa = finals.length ? Number((finals.reduce((a, b) => a + b, 0) / finals.length).toFixed(2)) : null
    const debts = exams.filter((g) => {
      const f = examFinal(g)
      return f != null && !isPassed(f)
    }).length + mine.filter((g) => g.control === 'Зачёт' && g.exam != null && g.exam < 3).length
    const quality = finals.length > 0 && finals.every((v) => v >= 4)
    return { id: s.id, fio: s.fio, gpa, debts, quality }
  }).sort((a, b) => (b.gpa ?? -1) - (a.gpa ?? -1))
  return rows.map((row, index) => ({ ...row, place: index + 1 }))
}

/** Ведомость по назначению (преподавателю — только по своему). */
export function sheet(assignmentId, user) {
  return listJournal(assignmentId, user)
}

/** Сводка одного студента: его дисциплины, итоги, средний, место, долги. */
export function studentCard(studentId) {
  const db = getDb()
  const student = db.prepare(`
    SELECT s.id, s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.middle_name, '') AS fio,
      g.name AS "group", g.id AS group_id
    FROM students s JOIN groups g ON g.id = s.group_id WHERE s.id = ?
  `).get(Number(studentId))
  if (!student) throw httpError(404, 'Студент не найден')
  const rows = db.prepare(`
    SELECT a.id, a.semester_id, sem.name AS semester, d.name AS discipline, d.control,
      ${SHORT_TEACHER} AS teacher,
      gr.lab, gr.coursework, gr.exam
    FROM assignments a
    JOIN semesters sem ON sem.id = a.semester_id
    JOIN disciplines d ON d.id = a.discipline_id
    JOIN teachers t ON t.id = a.teacher_id
    LEFT JOIN grades gr ON gr.assignment_id = a.id AND gr.student_id = ?
    WHERE a.group_id = ?
    ORDER BY d.name
  `).all(student.id, student.group_id)

  const mapped = rows.map((row, index) => {
    let final = null
    if (row.control === 'Зачёт') {
      final = row.exam == null ? '—' : (row.exam >= 3 ? 'зачтено' : 'незачтено')
    } else if (row.lab != null && row.coursework != null && row.exam != null) {
      final = Number(calcFinalGrade(row).toFixed(2))
    }
    return {
      id: index + 1,
      semester: row.semester,
      discipline: row.discipline,
      teacher: row.teacher,
      control: row.control,
      lab: row.lab ?? '—',
      coursework: row.coursework ?? '—',
      exam: row.exam ?? '—',
      final,
    }
  })

  // Студенту из рейтинга отдаём только СВОИ место/средний — чужие ФИО наружу не уходят.
  const ranked = rows.length ? ranking(student.group_id, rows[0].semester_id) : []
  const me = ranked.find((row) => row.id === student.id)
  return {
    student: { id: student.id, fio: student.fio, group: student.group },
    rows: mapped,
    gpa: me?.gpa ?? null,
    place: me?.place ?? null,
    total: ranked.length,
    debts: me?.debts ?? 0,
    semester: rows[0]?.semester ?? '—',
  }
}

export function listAudit() {
  return getDb().prepare(`
    SELECT a.id, a.time, a.entity, a.action, a.details,
      COALESCE(u.login, 'система') AS user
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.id DESC
    LIMIT 200
  `).all()
}

/** Цифры для главной страницы: по последнему семестру всех групп. */
export function stats() {
  const db = getDb()
  const students = db.prepare(`SELECT COUNT(*) AS n FROM students WHERE status = 'Учится'`).get().n
  const groups = db.prepare('SELECT COUNT(*) AS n FROM groups').get().n
  const sem = db.prepare('SELECT id, name FROM semesters ORDER BY id DESC LIMIT 1').get()
  const rankedAll = sem
    ? db.prepare('SELECT id FROM groups').all().flatMap((g) => ranking(g.id, sem.id))
    : []
  const withGpa = rankedAll.filter((row) => row.gpa != null)
  const avg = withGpa.length ? withGpa.reduce((s, r) => s + r.gpa, 0) / withGpa.length : 0
  const debts = rankedAll.filter((row) => row.debts > 0).length
  const quality = withGpa.length ? Math.round(100 * withGpa.filter((row) => row.quality).length / withGpa.length) : 0
  return {
    semester: sem?.name ?? '—',
    students,
    groups,
    gpa: Number(avg.toFixed(2)),
    debts,
    quality,
    recent: listAudit().slice(0, 8).map((row) => ({
      id: row.id,
      time: row.time,
      user: row.user,
      action: `${row.action}: ${row.entity}${row.details ? ' — ' + row.details : ''}`,
    })),
  }
}

/**
 * ТАБЛИЦА ПРАВ для справочников: кто может читать (read) и кто изменять (write).
 * Её использует src/lib/catalog-api.js для всех маршрутов /api/<справочник>.
 */
export const CATALOG = {
  students: { list: listStudents, create: createStudent, update: updateStudent, remove: deleteStudent, read: ['admin', 'dean', 'teacher'], write: ['admin', 'dean'] },
  groups: { list: listGroups, create: createGroup, update: updateGroup, remove: deleteGroup, read: ['admin', 'dean'], write: ['admin', 'dean'] },
  teachers: { list: listTeachers, create: createTeacher, update: updateTeacher, remove: deleteTeacher, read: ['admin', 'dean'], write: ['admin', 'dean'] },
  disciplines: { list: listDisciplines, create: createDiscipline, update: updateDiscipline, remove: deleteDiscipline, read: ['admin', 'dean', 'teacher'], write: ['admin', 'dean'] },
  assignments: { list: listAssignments, create: createAssignment, update: updateAssignment, remove: deleteAssignment, read: ['admin', 'dean', 'teacher'], write: ['admin', 'dean'] },
  users: { list: listUsers, create: createUser, update: updateUser, remove: deleteUser, read: ['admin'], write: ['admin'] },
}
