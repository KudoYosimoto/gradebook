/**
 * ДЕМО-ДАННЫЕ для защиты: 5 групп, 10 преподавателей, 15 дисциплин, 26 студентов, 240 оценок.
 *
 * Вызывается из db.js только когда таблица users пустая (первый запуск или npm run db:reset).
 * Пароли демо-учёток сразу хешируются — в базе открытого текста нет.
 */
import { hashPassword } from './crypto.js'

/** "Иванов Иван Иванович" → { last_name, first_name, middle_name } */
function fioParts(full) {
  const [last_name, first_name, middle_name = ''] = full.split(' ')
  return { last_name, first_name, middle_name }
}

export const SEED_TEACHERS = [
  { fio: 'Соколов Павел Викторович', dept: 'Информационных систем', title: 'Доцент', degree: 'к.т.н.', email: 'sokolov@univ.ru', login: 'teacher1', password: 'teacher123' },
  { fio: 'Петрова Анна Викторовна', dept: 'Информационных систем', title: 'Старший преподаватель', degree: '', email: 'petrova@univ.ru' },
  { fio: 'Кузнецова Ольга Юрьевна', dept: 'Иностранных языков', title: 'Доцент', degree: 'к.ф.н.', email: 'kuznetsova@univ.ru' },
  { fio: 'Белов Николай Иванович', dept: 'Экономики', title: 'Профессор', degree: 'д.э.н.', email: 'belov@univ.ru' },
  { fio: 'Морозов Игорь Сергеевич', dept: 'Автоматизированных систем', title: 'Доцент', degree: 'к.т.н.', email: 'morozov@univ.ru' },
  { fio: 'Орлова Татьяна Павловна', dept: 'Высшей математики', title: 'Доцент', degree: 'к.ф.-м.н.', email: 'orlova@univ.ru' },
  { fio: 'Смирнов Алексей Дмитриевич', dept: 'Информационных систем', title: 'Профессор', degree: 'д.т.н.', email: 'smirnov@univ.ru' },
  { fio: 'Васильева Ирина Олеговна', dept: 'Гуманитарных дисциплин', title: 'Старший преподаватель', degree: '', email: 'vasileva@univ.ru' },
  { fio: 'Николаев Сергей Петрович', dept: 'Информационной безопасности', title: 'Доцент', degree: 'к.т.н.', email: 'nikolaev@univ.ru' },
  { fio: 'Федорова Мария Александровна', dept: 'Программирования', title: 'Ассистент', degree: '', email: 'fedorova@univ.ru' },
]

export const SEED_GROUPS = [
  { name: 'ИС-21', specialty: 'Информационные системы', course: 4, form: 'Очная', year: 2021, curator: 1 },
  { name: 'ИС-22', specialty: 'Информационные системы', course: 3, form: 'Очная', year: 2022, curator: 2 },
  { name: 'ПИ-21', specialty: 'Прикладная информатика', course: 4, form: 'Очная', year: 2021, curator: 3 },
  { name: 'ЭК-20', specialty: 'Экономика', course: 5, form: 'Очно-заочная', year: 2020, curator: 4 },
  { name: 'АСУ-22', specialty: 'Автоматизированные системы', course: 3, form: 'Очная', year: 2022, curator: 5 },
]

export const SEED_DISCIPLINES = [
  { name: 'Базы данных', lectures: 36, practice: 18, labs: 36, control: 'Экзамен' },
  { name: 'Программирование', lectures: 32, practice: 32, labs: 16, control: 'Экзамен' },
  { name: 'Математический анализ', lectures: 48, practice: 32, labs: null, control: 'Экзамен' },
  { name: 'Английский язык', lectures: null, practice: 72, labs: null, control: 'Зачёт' },
  { name: 'Философия', lectures: 18, practice: 18, labs: null, control: 'Зачёт' },
  { name: 'Операционные системы', lectures: 24, practice: 12, labs: 24, control: 'Экзамен' },
  { name: 'Сети и телекоммуникации', lectures: 28, practice: 14, labs: 28, control: 'Экзамен' },
  { name: 'Веб-технологии', lectures: 20, practice: 20, labs: 32, control: 'Экзамен' },
  { name: 'Теория вероятностей', lectures: 36, practice: 36, labs: null, control: 'Экзамен' },
  { name: 'Правоведение', lectures: 18, practice: 18, labs: null, control: 'Зачёт' },
  { name: 'Информационная безопасность', lectures: 24, practice: 12, labs: 24, control: 'Экзамен' },
  { name: 'Проектирование ИС', lectures: 24, practice: 16, labs: 24, control: 'Диф. зачёт' },
  { name: 'Экономика', lectures: 32, practice: 16, labs: null, control: 'Зачёт' },
  { name: 'Дискретная математика', lectures: 36, practice: 36, labs: null, control: 'Экзамен' },
  { name: 'Учебная практика', lectures: null, practice: null, labs: 72, control: 'Зачёт' },
]

export const SEED_STUDENTS = [
  { fio: 'Петров Алексей Сергеевич', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Сидорова Мария Игоревна', group: 'ИС-21', form: 'Очная', status: 'Учится', login: 'student1', password: 'student123' },
  { fio: 'Кузнецов Дмитрий Владимирович', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Андреев Дмитрий Сергеевич', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Морозов Иван Петрович', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Новикова Анна Олеговна', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Волков Сергей Николаевич', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Белова Екатерина Андреевна', group: 'ИС-21', form: 'Очная', status: 'Учится' },
  { fio: 'Козлов Артём Николаевич', group: 'ИС-22', form: 'Очная', status: 'Учится' },
  { fio: 'Смирнова Ольга Викторовна', group: 'ИС-22', form: 'Очная', status: 'Учится' },
  { fio: 'Алиева Нина Рашидовна', group: 'ИС-22', form: 'Очная', status: 'Академ. отпуск' },
  { fio: 'Павлов Кирилл Андреевич', group: 'ИС-22', form: 'Очная', status: 'Учится' },
  { fio: 'Егорова Дарья Павловна', group: 'ИС-22', form: 'Очная', status: 'Учится' },
  { fio: 'Лебедев Максим Ильич', group: 'ПИ-21', form: 'Очная', status: 'Учится' },
  { fio: 'Соловьёва Виктория Сергеевна', group: 'ПИ-21', form: 'Очная', status: 'Учится' },
  { fio: 'Орлов Павел Игоревич', group: 'ПИ-21', form: 'Очная', status: 'Отчислен' },
  { fio: 'Громов Никита Алексеевич', group: 'ПИ-21', form: 'Очная', status: 'Учится' },
  { fio: 'Зайцева Полина Романовна', group: 'ПИ-21', form: 'Очная', status: 'Учится' },
  { fio: 'Крылов Артём Олегович', group: 'ЭК-20', form: 'Очно-заочная', status: 'Учится' },
  { fio: 'Медведева Алина Викторовна', group: 'ЭК-20', form: 'Очно-заочная', status: 'Учится' },
  { fio: 'Савельев Игорь Николаевич', group: 'ЭК-20', form: 'Очно-заочная', status: 'Учится' },
  { fio: 'Тихонова Елена Марковна', group: 'ЭК-20', form: 'Очно-заочная', status: 'Учится' },
  { fio: 'Фролов Денис Валерьевич', group: 'АСУ-22', form: 'Очная', status: 'Учится' },
  { fio: 'Чернова Юлия Андреевна', group: 'АСУ-22', form: 'Очная', status: 'Учится' },
  { fio: 'Шестаков Роман Игоревич', group: 'АСУ-22', form: 'Очная', status: 'Учится' },
  { fio: 'Яковлева Ксения Дмитриевна', group: 'АСУ-22', form: 'Очная', status: 'Учится' },
]

const DISC_FOR_GROUP = {
  'ИС-21': [1, 2, 3, 4, 5, 6, 8, 11, 12, 14],
  'ИС-22': [1, 2, 4, 6, 7, 8, 10, 11, 12, 15],
  'ПИ-21': [1, 2, 3, 4, 6, 7, 9, 12, 14, 15],
  'ЭК-20': [3, 4, 5, 9, 10, 13, 14, 7, 12, 15],
  'АСУ-22': [1, 2, 6, 7, 8, 11, 12, 14, 4, 15],
}

const TEACHER_FOR_DISC = {
  1: 1, 2: 10, 3: 6, 4: 3, 5: 8, 6: 1, 7: 7, 8: 10, 9: 6, 10: 8, 11: 9, 12: 2, 13: 4, 14: 6, 15: 5,
}

// Какие дисциплины назначены каждой группе (номера — порядок в SEED_DISCIPLINES, с 1)
// и кто их ведёт (TEACHER_FOR_DISC: номер дисциплины → номер преподавателя) — см. выше.

/**
 * Детерминированная «случайная» оценка 3–5: одни и те же данные при каждом пересоздании базы,
 * чтобы цифры на защите не менялись. kind: 1 — лаб., 2 — КР, 3 — экзамен.
 */
function mark(studentId, assignmentId, kind) {
  const n = (studentId * 17 + assignmentId * 13 + kind * 7) % 8
  return [3, 3, 4, 4, 4, 4, 5, 5][n]
}

/** Заполнение базы. Всё в одной транзакции: либо записалось всё, либо ничего. */
export function seedDatabase(db) {
  const insertUser = db.prepare(`
    INSERT INTO users (login, password_hash, role, display_name, status)
    VALUES (@login, @password_hash, @role, @display_name, 'Активен')
  `)
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (user_id, last_name, first_name, middle_name, dept, title, degree, email)
    VALUES (@user_id, @last_name, @first_name, @middle_name, @dept, @title, @degree, @email)
  `)
  const insertGroup = db.prepare(`
    INSERT INTO groups (name, specialty, course, form, year, curator_id)
    VALUES (@name, @specialty, @course, @form, @year, @curator_id)
  `)
  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, last_name, first_name, middle_name, group_id, form, status)
    VALUES (@user_id, @last_name, @first_name, @middle_name, @group_id, @form, @status)
  `)
  const insertDisc = db.prepare(`
    INSERT INTO disciplines (name, lectures, practice, labs, control)
    VALUES (@name, @lectures, @practice, @labs, @control)
  `)
  const insertAssign = db.prepare(`
    INSERT INTO assignments (semester_id, group_id, discipline_id, teacher_id)
    VALUES (@semester_id, @group_id, @discipline_id, @teacher_id)
  `)
  const insertGrade = db.prepare(`
    INSERT INTO grades (assignment_id, student_id, lab, coursework, exam)
    VALUES (@assignment_id, @student_id, @lab, @coursework, @exam)
  `)
  const insertAudit = db.prepare(`
    INSERT INTO audit_log (time, user_id, entity, action, details)
    VALUES (@time, @user_id, @entity, @action, @details)
  `)

  const tx = db.transaction(() => {
    const adminId = insertUser.run({
      login: 'admin',
      password_hash: hashPassword('admin123'),
      role: 'admin',
      display_name: 'Петров Игорь Константинович',
    }).lastInsertRowid
    const deanId = insertUser.run({
      login: 'dean',
      password_hash: hashPassword('dean123'),
      role: 'dean',
      display_name: 'Иванова Елена Александровна',
    }).lastInsertRowid

    const teacherIds = []
    for (const t of SEED_TEACHERS) {
      let userId = null
      if (t.login) {
        userId = insertUser.run({
          login: t.login,
          password_hash: hashPassword(t.password),
          role: 'teacher',
          display_name: t.fio,
        }).lastInsertRowid
      }
      const parts = fioParts(t.fio)
      teacherIds.push(insertTeacher.run({
        user_id: userId,
        ...parts,
        dept: t.dept,
        title: t.title,
        degree: t.degree || '—',
        email: t.email,
      }).lastInsertRowid)
    }

    const groupIds = {}
    for (const g of SEED_GROUPS) {
      groupIds[g.name] = insertGroup.run({
        name: g.name,
        specialty: g.specialty,
        course: g.course,
        form: g.form,
        year: g.year,
        curator_id: teacherIds[g.curator - 1],
      }).lastInsertRowid
    }

    for (const d of SEED_DISCIPLINES) {
      insertDisc.run(d)
    }

    const studentIds = []
    for (const s of SEED_STUDENTS) {
      let userId = null
      if (s.login) {
        userId = insertUser.run({
          login: s.login,
          password_hash: hashPassword(s.password),
          role: 'student',
          display_name: s.fio,
        }).lastInsertRowid
      }
      const parts = fioParts(s.fio)
      studentIds.push({
        id: insertStudent.run({
          user_id: userId,
          ...parts,
          group_id: groupIds[s.group],
          form: s.form,
          status: s.status,
        }).lastInsertRowid,
        group: s.group,
        status: s.status,
        fio: s.fio,
      })
    }

    const semesterId = db.prepare('INSERT INTO semesters (name) VALUES (?)').run('Весна 2026').lastInsertRowid

    const assignmentRows = []
    for (const [groupName, discIds] of Object.entries(DISC_FOR_GROUP)) {
      for (const discId of discIds) {
        const id = insertAssign.run({
          semester_id: semesterId,
          group_id: groupIds[groupName],
          discipline_id: discId,
          teacher_id: teacherIds[TEACHER_FOR_DISC[discId] - 1],
        }).lastInsertRowid
        assignmentRows.push({ id, group: groupName, discId })
      }
    }

    const controls = Object.fromEntries(
      db.prepare('SELECT id, control FROM disciplines').all().map((row) => [row.id, row.control]),
    )

    for (const a of assignmentRows) {
      const control = controls[a.discId]
      for (const s of studentIds) {
        if (s.group !== a.group || s.status !== 'Учится') continue
        const sid = Number(s.id)
        const aid = Number(a.id)
        let lab = mark(sid, aid, 1)
        let coursework = mark(sid, aid, 2)
        let exam = mark(sid, aid, 3)
        if (s.fio.includes('Новикова')) { lab = 5; coursework = 5; exam = 5 }
        if (s.fio.includes('Сидорова')) { lab = 5; coursework = 5; exam = 4 }
        if (s.fio.includes('Петров Алексей')) { lab = 5; coursework = 4; exam = 5 }
        if (s.fio.includes('Волков') && a.discId === 1) exam = 2
        if (s.fio.includes('Морозов Иван') && a.discId === 1) { lab = 3; coursework = 2; exam = 3 }
        if (s.fio.includes('Смирнова Ольга') && a.discId === 6) exam = 2
        if (control === 'Зачёт') {
          lab = null
          coursework = null
          exam = exam >= 3 ? 5 : 2
        }
        insertGrade.run({
          assignment_id: aid,
          student_id: sid,
          lab,
          coursework,
          exam,
        })
      }
    }

    insertAudit.run({
      time: '2026-09-02 09:00:00',
      user_id: adminId,
      entity: 'Пользователь',
      action: 'Создание',
      details: 'Созданы демо-учётные записи',
    })
    insertAudit.run({
      time: '2026-09-02 11:05:00',
      user_id: deanId,
      entity: 'Назначение',
      action: 'Создание',
      details: 'Назначены дисциплины на весну 2026',
    })
    insertAudit.run({
      time: '2026-09-03 16:12:00',
      user_id: deanId,
      entity: 'Студент',
      action: 'Создание',
      details: 'Заполнен справочник студентов',
    })
    insertAudit.run({
      time: '2026-09-03 18:40:00',
      user_id: teacherIds[0] ? db.prepare('SELECT user_id FROM teachers WHERE id = 1').get()?.user_id : null,
      entity: 'Оценка',
      action: 'Изменение',
      details: 'Выставлены оценки по дисциплине «Базы данных», группа ИС-21',
    })
  })

  tx()
}
