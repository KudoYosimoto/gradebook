'use client'

import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { canEditCatalog } from "@/auth/roles";
import { Button, PageHeader, RowActions, Search, Table, Toolbar } from "@/components/UI/primitives";
import { Field, ModalForm } from "@/components/UI/Modal";
import { useToast } from "@/components/UI/Toast";
import { gradeColor, statusColor } from "@/lib/grades";
import { useCallback, useEffect, useMemo, useState } from "react";

const EMPTY = { last_name: '', first_name: '', middle_name: '', group_id: '', form: 'Очная', status: 'Учится' }

export default function StudentsPage() {
  const toast = useToast()
  const { user } = useAuth()
  const canEdit = canEditCatalog(user.role)
  const [rows, setRows] = useState([])
  const [lookups, setLookups] = useState({ groups: [] })
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const groups = [...new Set(rows.map((item) => item.group))]

  // Загрузка с сервера. Вызывается при открытии страницы и после каждого сохранения/удаления.
  const reload = useCallback(() => {
    api.getStudents().then(setRows).catch((err) => toast.show(err.message, 'error'))
    api.getLookups().then(setLookups).catch(() => {})
  }, [toast])

  useEffect(() => { reload() }, [reload])

  // Фильтрация на клиенте: данных немного, лишний запрос на каждую букву не нужен.
  const filtered = useMemo(() => rows.filter((item) => {
    if (query && !item.fio.toLowerCase().includes(query.toLowerCase())) return false
    if (group && item.group !== group) return false
    if (status && item.status !== status) return false
    return true
  }), [rows, query, group, status])

  const columns = [
    { key: 'fio', label: 'ФИО' },
    { key: 'group', label: 'Группа' },
    { key: 'form', label: 'Форма' },
    { key: 'status', label: 'Статус', render: (row) => (
      <span className={statusColor(row.status)}>{row.status}</span>
    ) },
    { key: 'gpa', label: 'Ср. балл', className: 'num', render: (row) => (
      <span className={gradeColor(row.gpa)}>{row.gpa ?? '—'}</span>
    ) },
    ...(canEdit ? [{ key: 'actions', label: 'Действия', render: (row) => (
      <RowActions
        onEdit={() => { setForm({ ...EMPTY, ...row, middle_name: row.middle_name ?? '', group_id: row.group_id }); setModal(row) }}
        onDelete={() => remove(row)}
      />
    ) }] : []),
  ]

  async function remove(row) {
    if (!confirm(`Удалить студента ${row.fio}?`)) return
    try {
      await api.deleteStudent(row.id)
      toast.show('Студент удалён')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    }
  }

  // modal = {} — новая запись (POST), modal = строка с id — изменение (PUT).
  async function save() {
    setBusy(true)
    try {
      if (modal?.id) await api.updateStudent(modal.id, form)
      else await api.createStudent(form)
      toast.show('Сохранено')
      setModal(null)
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <PageHeader title="Студенты" subtitle="Справочник обучающихся" />
      <Toolbar actions={canEdit ? <Button onClick={() => { setForm(EMPTY); setModal({}) }}>+ Добавить студента</Button> : null}>
        <Search placeholder="Поиск по ФИО" query={query} setQuery={setQuery} />
        <div className="selectBlock">
          <select className="select" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Все группы</option>
            {groups.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="selectBlock">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Все статусы</option>
            <option>Учится</option>
            <option>Академ. отпуск</option>
            <option>Отчислен</option>
          </select>
        </div>
        <Button variant="ghost" onClick={() => { setQuery(''); setGroup(''); setStatus('') }}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={columns} rows={filtered} />
      <ModalForm
        open={Boolean(modal)}
        title={modal?.id ? 'Изменить студента' : 'Новый студент'}
        onClose={() => setModal(null)}
        onSubmit={save}
        busy={busy}
      >
        <Field label="Фамилия">
          <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </Field>
        <Field label="Имя">
          <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </Field>
        <Field label="Отчество">
          <input className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
        </Field>
        <Field label="Группа">
          <select className="select" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
            <option value="">Выберите группу</option>
            {lookups.groups.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Форма">
          <select className="select" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })}>
            <option>Очная</option>
            <option>Очно-заочная</option>
            <option>Заочная</option>
          </select>
        </Field>
        <Field label="Статус">
          <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Учится</option>
            <option>Академ. отпуск</option>
            <option>Отчислен</option>
          </select>
        </Field>
      </ModalForm>
    </div>
  )
}
