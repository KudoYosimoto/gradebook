'use client'

/**
 * ПОЛЬЗОВАТЕЛИ (/users). Только администратор.
 * Создание учётки, смена роли/статуса, сброс пароля (ввести новый при изменении).
 * Для ролей «Преподаватель» и «Студент» учётку нужно привязать к человеку из справочника —
 * иначе преподаватель не увидит свои журналы, а студент — свои оценки.
 */
import { api } from "@/api";
import { ROLE_LABEL } from "@/auth/roles";
import { Button, PageHeader, RowActions, Search, Table, Toolbar } from "@/components/UI/primitives";
import { Field, ModalForm } from "@/components/UI/Modal";
import { useToast } from "@/components/UI/Toast";
import { useCallback, useEffect, useMemo, useState } from "react";

const EMPTY = { login: '', password: '', name: '', role: 'dean', status: 'Активен', teacher_id: '', student_id: '' }

export default function UsersPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [lookups, setLookups] = useState({ teachers: [], students: [] })
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const roles = [...new Set(rows.map((item) => item.role))]

  const reload = useCallback(() => {
    api.getUsers().then(setRows).catch((err) => toast.show(err.message, 'error'))
    api.getLookups().then(setLookups).catch(() => {})
  }, [toast])

  useEffect(() => { reload() }, [reload])

  const filtered = useMemo(() => rows.filter((item) => {
    const q = query.toLowerCase()
    if (q && !item.login.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q)) return false
    if (role && item.role !== role) return false
    return true
  }), [rows, query, role])

  const columns = [
    { key: 'login', label: 'Логин' },
    { key: 'name', label: 'ФИО' },
    { key: 'role', label: 'Роль', render: (row) => ROLE_LABEL[row.role] ?? row.role },
    { key: 'status', label: 'Статус', render: (row) => (
      <span className={row.status === 'Активен' ? 'badge ok' : 'badge bad'}>{row.status}</span>
    ) },
    { key: 'actions', label: 'Действия', render: (row) => (
      <RowActions
        onEdit={() => {
          setForm({ ...EMPTY, ...row, password: '', teacher_id: row.teacher_id ?? '', student_id: row.student_id ?? '' })
          setModal(row)
        }}
        onDelete={() => remove(row)}
      />
    ) },
  ]

  async function remove(row) {
    if (!confirm(`Удалить учётную запись ${row.login}?`)) return
    try {
      await api.deleteUser(row.id)
      toast.show('Пользователь удалён')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    }
  }

  async function save() {
    setBusy(true)
    try {
      if (modal?.id) await api.updateUser(modal.id, form)
      else await api.createUser(form)
      toast.show('Сохранено')
      setModal(null)
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  // Свободные люди + тот, кто уже привязан к редактируемой учётке.
  const freeTeachers = lookups.teachers.filter((t) => !t.user_id || t.user_id === modal?.id)
  const freeStudents = lookups.students.filter((s) => !s.user_id || s.user_id === modal?.id)

  return (
    <div className="container">
      <PageHeader title="Пользователи" subtitle="Учётные записи системы" />
      <Toolbar actions={<Button onClick={() => { setForm(EMPTY); setModal({}) }}>+ Создать учётную запись</Button>}>
        <Search placeholder="Поиск по логину или ФИО" query={query} setQuery={setQuery} />
        <div className="selectBlock">
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Все роли</option>
            {roles.map((item) => (
              <option key={item} value={item}>{ROLE_LABEL[item] ?? item}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" onClick={() => { setQuery(''); setRole('') }}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={columns} rows={filtered} />
      <ModalForm
        open={Boolean(modal)}
        title={modal?.id ? 'Изменить пользователя' : 'Новый пользователь'}
        onClose={() => setModal(null)}
        onSubmit={save}
        busy={busy}
      >
        <Field label="Логин (латиница, 3–32 символа)">
          <input className="input" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </Field>
        <Field label={modal?.id ? 'Новый пароль (пусто — не менять)' : 'Пароль (от 6 символов)'}>
          <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="ФИО">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Роль">
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Администратор</option>
            <option value="dean">Деканат</option>
            <option value="teacher">Преподаватель</option>
            <option value="student">Студент</option>
          </select>
        </Field>
        {form.role === 'teacher' ? (
          <Field label="Кто это из преподавателей">
            <select className="select" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">Не привязан</option>
              {freeTeachers.map((item) => (
                <option key={item.id} value={item.id}>{item.fio}</option>
              ))}
            </select>
          </Field>
        ) : null}
        {form.role === 'student' ? (
          <Field label="Кто это из студентов">
            <select className="select" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
              <option value="">Не привязан</option>
              {freeStudents.map((item) => (
                <option key={item.id} value={item.id}>{item.fio} · {item.group_name}</option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Статус">
          <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Активен</option>
            <option>Заблокирован</option>
          </select>
        </Field>
      </ModalForm>
    </div>
  )
}
