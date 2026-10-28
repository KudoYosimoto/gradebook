export const ROLES = {
  ADMIN: "admin",
  DEAN: "dean",
  TEACHER: "teacher",
  STUDENT: "student",
}

export const ROLE_LABEL = {
  admin: 'Администратор',
  dean: 'Деканат',
  teacher: 'Преподаватель',
  student: 'Студент',
}

export const HOME_BY_ROLE = {
  admin: '/home',
  dean: '/home',
  teacher: '/grades',
  student: '/me',
}

export const CRUMBS = {
  home: ['Обзор', 'Главная'],
  students: ['Справочники', 'Студенты'],
  groups: ['Справочники', 'Группы'],
  disciplines: ['Справочники', 'Дисциплины'],
  teachers: ['Справочники', 'Преподаватели'],
  assignments: ['Учебный процесс', 'Назначения'],
  grades: ['Учебный процесс', 'Оценки'],
  reports: ['Аналитика', 'Отчёты'],
  users: ['Администрирование', 'Пользователи'],
  audit: ['Администрирование', 'Журнал'],
  me: ['Кабинет', 'Мои оценки'],
}

export const MENU = [
  { id: 'home', to: '/home', label: 'Главная', icon: 'home', roles: ['admin', 'dean'] },
  { id: 'students', to: '/students', label: 'Студенты', icon: 'users', roles: ['admin', 'dean', 'teacher'] },
  { id: 'groups', to: '/groups', label: 'Группы', icon: 'groups', roles: ['admin', 'dean'] },
  { id: 'teachers', to: '/teachers', label: 'Преподаватели', icon: 'teacher', roles: ['admin', 'dean'] },
  { id: 'disciplines', to: '/disciplines', label: 'Дисциплины', icon: 'book', roles: ['admin', 'dean'] },
  { id: 'assignments', to: '/assignments', label: 'Назначения', icon: 'link', roles: ['admin', 'dean'] },
  { id: 'grades', to: '/grades', label: 'Оценки', icon: 'grades', roles: ['admin', 'teacher'] },
  { id: 'me', to: '/me', label: 'Мои оценки', icon: 'grades', roles: ['student'] },
  { id: 'reports', to: '/reports', label: 'Отчёты', icon: 'report', roles: ['admin', 'dean', 'teacher'] },
  { id: 'users', to: '/users', label: 'Пользователи', icon: 'key', roles: ['admin'] },
  { id: 'audit', to: '/audit', label: 'Журнал', icon: 'log', roles: ['admin'] },
]

export function canVisit(role, pathname){
  return MENU.some(item => item.to === pathname && item.roles.includes(role))
}

export function canEditCatalog(role) {
  return role === 'admin' || role === 'dean'
}
