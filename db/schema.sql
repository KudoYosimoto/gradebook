PRAGMA foreign_keys = ON;

-- Учётные записи для входа. Пароль хранится только как хеш scrypt ("scrypt$соль$хеш").
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY,
  login          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('admin', 'dean', 'teacher', 'student')),
  display_name   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Активен' CHECK (status IN ('Активен', 'Заблокирован')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Преподаватели. user_id — связь с учёткой (у кого-то её может не быть).
-- Удалили учётку → у преподавателя user_id станет NULL, сам он останется.
CREATE TABLE IF NOT EXISTS teachers (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  last_name    TEXT NOT NULL,
  first_name   TEXT NOT NULL,
  middle_name  TEXT,
  dept         TEXT NOT NULL,
  title        TEXT NOT NULL,
  degree       TEXT,
  email        TEXT
);

-- Учебные группы. curator_id — преподаватель-куратор.
CREATE TABLE IF NOT EXISTS groups (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  specialty    TEXT NOT NULL,
  course       INTEGER NOT NULL CHECK (course BETWEEN 1 AND 6),
  form         TEXT NOT NULL,
  year         INTEGER NOT NULL,
  curator_id   INTEGER REFERENCES teachers(id) ON DELETE SET NULL
);

-- Студенты. Группа хранится ссылкой group_id, а не названием — это и есть нормализация:
-- переименовали группу в одном месте, и у всех студентов она поменялась.
CREATE TABLE IF NOT EXISTS students (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  last_name    TEXT NOT NULL,
  first_name   TEXT NOT NULL,
  middle_name  TEXT,
  group_id     INTEGER NOT NULL REFERENCES groups(id),
  form         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Учится'
               CHECK (status IN ('Учится', 'Академ. отпуск', 'Отчислен'))
);

-- Дисциплины и форма контроля.
CREATE TABLE IF NOT EXISTS disciplines (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  lectures   INTEGER,
  practice   INTEGER,
  labs       INTEGER,
  control    TEXT NOT NULL CHECK (control IN ('Экзамен', 'Зачёт', 'Диф. зачёт'))
);

CREATE TABLE IF NOT EXISTS semesters (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

-- Назначения: какая дисциплина у какой группы в каком семестре и кто её ведёт.
-- Развязывает связь «многие-ко-многим» между группами и дисциплинами.
-- UNIQUE: одну дисциплину одной группе в одном семестре дважды не назначить.
CREATE TABLE IF NOT EXISTS assignments (
  id             INTEGER PRIMARY KEY,
  semester_id    INTEGER NOT NULL REFERENCES semesters(id),
  group_id       INTEGER NOT NULL REFERENCES groups(id),
  discipline_id  INTEGER NOT NULL REFERENCES disciplines(id),
  teacher_id     INTEGER NOT NULL REFERENCES teachers(id),
  UNIQUE (semester_id, group_id, discipline_id)
);

-- Оценки: одна строка = один студент по одному назначению.
-- Удалили назначение или студента → его оценки удаляются (CASCADE).
-- Итог (лаб*0.3 + КР*0.3 + экзамен*0.4) не хранится — считается.
CREATE TABLE IF NOT EXISTS grades (
  id             INTEGER PRIMARY KEY,
  assignment_id  INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id     INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lab            REAL CHECK (lab IS NULL OR lab BETWEEN 2 AND 5),
  coursework     REAL CHECK (coursework IS NULL OR coursework BETWEEN 2 AND 5),
  exam           REAL CHECK (exam IS NULL OR exam BETWEEN 2 AND 5),
  UNIQUE (assignment_id, student_id)
);

-- Журнал действий: кто, когда, что сделал. user_id = NULL — действие системы или гостя (неудачный вход).
CREATE TABLE IF NOT EXISTS audit_log (
  id        INTEGER PRIMARY KEY,
  time      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  entity    TEXT NOT NULL,
  action    TEXT NOT NULL,
  details   TEXT
);

-- Индексы ускоряют частые выборки: студенты группы, журнал по назначению, оценки студента.
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lookup ON assignments(semester_id, group_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment ON grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(time);
