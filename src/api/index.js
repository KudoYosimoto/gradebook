async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  })
  if (res.status === 204) return null
  const contentType = res.headers.get('content-type') || ''
  // Не JSON (например, скачивание файла базы)
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new Error('Ошибка запроса')
    return res
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса')
  return data
}

/*вход / выход*/

export function loginRequest(login, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  }).then((data) => data.user)
}

export function logoutRequest() {
  return request('/api/auth/logout', { method: 'POST' })
}

export function meRequest() {
  return request('/api/auth/me').then((data) => data.user)
}

/*справочники: одинаковый набор list / create / update / remove*/

function collection(path) {
  return {
    list: () => request(path),
    create: (body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
  }
}

const students = collection('/api/students')
const groups = collection('/api/groups')
const teachers = collection('/api/teachers')
const disciplines = collection('/api/disciplines')
const assignments = collection('/api/assignments')
const users = collection('/api/users')

export const api = {
  getStudents: students.list,
  createStudent: students.create,
  updateStudent: students.update,
  deleteStudent: students.remove,
  getGroups: groups.list,
  createGroup: groups.create,
  updateGroup: groups.update,
  deleteGroup: groups.remove,
  getTeachers: teachers.list,
  createTeacher: teachers.create,
  updateTeacher: teachers.update,
  deleteTeacher: teachers.remove,
  getDisciplines: disciplines.list,
  createDiscipline: disciplines.create,
  updateDiscipline: disciplines.update,
  deleteDiscipline: disciplines.remove,
  getAssignments: assignments.list,
  createAssignment: assignments.create,
  updateAssignment: assignments.update,
  deleteAssignment: assignments.remove,
  getUsers: users.list,
  createUser: users.create,
  updateUser: users.update,
  deleteUser: users.remove,

  getLookups: () => request('/api/lookups'),

  /* журнал оценок */
  getJournal: (assignmentId) => request(`/api/grades?assignmentId=${encodeURIComponent(assignmentId)}`),
  saveJournal: (assignmentId, rows) => request('/api/grades', {
    method: 'PUT',
    body: JSON.stringify({ assignmentId, rows }),
  }),

  /* отчёты, кабинет, главная, журнал действий */
  getReports: (params) => request(`/api/reports?${new URLSearchParams(params)}`),
  getMyGrades: () => request('/api/me/grades'),
  getStats: () => request('/api/stats'),
  getAuditLog: () => request('/api/audit'),

  /* резервная копия: скачиваем файл через временную ссылку */
  downloadDb: async () => {
    const res = await request('/api/backup')
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'gradebook.db'
    a.click()
    URL.revokeObjectURL(a.href)
  },
  restoreDb: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('/api/backup', { method: 'POST', body: form })
  },
}

/**
 * Выгрузка «в Excel»: CSV с разделителем «;» и BOM (\uFEFF)*/
export function downloadCsv(filename, headers, rows) {
  const esc = (value) => {
    let s = String(value ?? '')
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return `"${s.replaceAll('"', '""')}"`
  }
  const lines = [headers.map(esc).join(';'), ...rows.map((row) => row.map(esc).join(';'))]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
