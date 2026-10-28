'use client'

import { api } from "@/api";
import { Button, PageHeader, RowActions, Search, Table, Toolbar } from "@/components/UI/primitives";
import { Field, ModalForm } from "@/components/UI/Modal";
import { useToast } from "@/components/UI/Toast";
import { useEffect, useMemo, useState } from "react";

const EMPTY = { name: '', specialty: '', course: 1, form: 'Очная', year: 2024, curator_id: '' }

export default function GroupsPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [lookups, setLookups] = useState({ teachers: [] })
  const [query, setQuery] = useState('')
  const [formFilter, setFormFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const forms = [...new Set(rows.map((item) => item.form))]

  function reload() {
    api.getGroups().then(setRows)
    api.getLookups().then(setLookups).catch(() => {})
  }

  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => rows.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false
    if (formFilter && item.form !== formFilter) return false
    return true
  }), [rows, query, formFilter])

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'specialty', label: 'Специальность' },
    { key: 'course', label: 'Курс' },
    { key: 'form', label: 'Форма' },
    { key: 'year', label: 'Год набора' },
    { key: 'curator', label: 'Куратор' },
    { key: 'actions', label: 'Действия', render: (row) => (
      <RowActions
        onEdit={() => { setForm({ ...EMPTY, ...row, curator_id: row.curator_id || '' }); setModal(row) }}
        onDelete={() => remove(row)}
      />
    ) },
  ]

  async function remove(row) {
    if (!confirm(`Удалить группу ${row.name}?`)) return
    try {
      await api.deleteGroup(row.id)
      toast.show('Группа удалена')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    }
  }

  async function save() {
    setBusy(true)
    try {
      if (modal?.id) await api.updateGroup(modal.id, form)
      else await api.createGroup(form)
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
      <PageHeader title="Группы" subtitle="Учебные группы и курсы" />
      <Toolbar actions={<Button onClick={() => { setForm(EMPTY); setModal({}) }}>+ Добавить группу</Button>}>
        <Search placeholder="Поиск по названию" query={query} setQuery={setQuery} />
        <div className="selectBlock">
          <select className="select" value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
            <option value="">Все формы</option>
            {forms.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" onClick={() => { setQuery(''); setFormFilter('') }}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={columns} rows={filtered} />
      <ModalForm
        open={Boolean(modal)}
        title={modal?.id ? 'Изменить группу' : 'Новая группа'}
        onClose={() => setModal(null)}
        onSubmit={save}
        busy={busy}
      >
        <Field label="Название">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Специальность">
          <input className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </Field>
        <Field label="Курс">
          <input className="input" type="number" min="1" max="6" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
        </Field>
        <Field label="Форма">
          <select className="select" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })}>
            <option>Очная</option>
            <option>Очно-заочная</option>
            <option>Заочная</option>
          </select>
        </Field>
        <Field label="Год набора">
          <input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
        </Field>
        <Field label="Куратор">
          <select className="select" value={form.curator_id} onChange={(e) => setForm({ ...form, curator_id: e.target.value })}>
            <option value="">Без куратора</option>
            {lookups.teachers.map((item) => (
              <option key={item.id} value={item.id}>{item.fio}</option>
            ))}
          </select>
        </Field>
      </ModalForm>
    </div>
  )
}
