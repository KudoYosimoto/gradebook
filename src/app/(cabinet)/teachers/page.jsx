'use client'

import { api } from "@/api";
import { Button, PageHeader, RowActions, Search, Table, Toolbar } from "@/components/UI/primitives";
import { Field, ModalForm } from "@/components/UI/Modal";
import { useToast } from "@/components/UI/Toast";
import { useEffect, useMemo, useState } from "react";

const EMPTY = { last_name: '', first_name: '', middle_name: '', dept: '', title: 'Доцент', degree: '', email: '' }

export default function TeachersPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const depts = [...new Set(rows.map((item) => item.dept))]

  function reload() {
    api.getTeachers().then(setRows)
  }

  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => rows.filter((item) => {
    if (query && !item.fio.toLowerCase().includes(query.toLowerCase())) return false
    if (dept && item.dept !== dept) return false
    return true
  }), [rows, query, dept])

  const columns = [
    { key: 'fio', label: 'ФИО' },
    { key: 'dept', label: 'Кафедра' },
    { key: 'title', label: 'Должность' },
    { key: 'degree', label: 'Степень' },
    { key: 'email', label: 'Контакты' },
    { key: 'actions', label: 'Действия', render: (row) => (
      <RowActions
        onEdit={() => { setForm({ ...EMPTY, ...row, middle_name: row.middle_name ?? '', degree: row.degree === '—' ? '' : row.degree, email: row.email ?? '' }); setModal(row) }}
        onDelete={() => remove(row)}
      />
    ) },
  ]

  async function remove(row) {
    if (!confirm(`Удалить преподавателя ${row.fio}?`)) return
    try {
      await api.deleteTeacher(row.id)
      toast.show('Преподаватель удалён')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    }
  }

  async function save() {
    setBusy(true)
    try {
      if (modal?.id) await api.updateTeacher(modal.id, form)
      else await api.createTeacher(form)
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
      <PageHeader title="Преподаватели" subtitle="Кафедры и контакты" />
      <Toolbar actions={<Button onClick={() => { setForm(EMPTY); setModal({}) }}>+ Добавить</Button>}>
        <Search placeholder="Поиск по ФИО" query={query} setQuery={setQuery} />
        <div className="selectBlock">
          <select className="select" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Все кафедры</option>
            {depts.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" onClick={() => { setQuery(''); setDept('') }}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={columns} rows={filtered} />
      <ModalForm
        open={Boolean(modal)}
        title={modal?.id ? 'Изменить преподавателя' : 'Новый преподаватель'}
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
        <Field label="Кафедра">
          <input className="input" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
        </Field>
        <Field label="Должность">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Степень">
          <input className="input" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
      </ModalForm>
    </div>
  )
}
