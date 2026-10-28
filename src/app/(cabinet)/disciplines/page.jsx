'use client'

import { api } from "@/api";
import { Button, PageHeader, RowActions, Search, Table, Toolbar } from "@/components/UI/primitives";
import { Field, ModalForm } from "@/components/UI/Modal";
import { useToast } from "@/components/UI/Toast";
import { useEffect, useMemo, useState } from "react";

const EMPTY = { name: '', lectures: '', practice: '', labs: '', control: 'Экзамен' }

export default function DisciplinesPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [control, setControl] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const controls = [...new Set(rows.map((item) => item.control))]

  function reload() {
    api.getDisciplines().then(setRows)
  }

  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => rows.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false
    if (control && item.control !== control) return false
    return true
  }), [rows, query, control])

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'lectures', label: 'Лекции' },
    { key: 'practice', label: 'Практики' },
    { key: 'labs', label: 'Лаб.' },
    { key: 'control', label: 'Контроль' },
    { key: 'actions', label: 'Действия', render: (row) => (
      <RowActions
        onEdit={() => { setForm({ ...EMPTY, ...row, lectures: row.lectures ?? '', practice: row.practice ?? '', labs: row.labs ?? '' }); setModal(row) }}
        onDelete={() => remove(row)}
      />
    ) },
  ]

  async function remove(row) {
    if (!confirm(`Удалить дисциплину «${row.name}»?`)) return
    try {
      await api.deleteDiscipline(row.id)
      toast.show('Дисциплина удалена')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    }
  }

  async function save() {
    setBusy(true)
    try {
      if (modal?.id) await api.updateDiscipline(modal.id, form)
      else await api.createDiscipline(form)
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
      <PageHeader title="Дисциплины" subtitle="Предметы и формы контроля" />
      <Toolbar actions={<Button onClick={() => { setForm(EMPTY); setModal({}) }}>+ Добавить</Button>}>
        <Search placeholder="Поиск по названию" query={query} setQuery={setQuery} />
        <div className="selectBlock">
          <select className="select" value={control} onChange={(e) => setControl(e.target.value)}>
            <option value="">Все виды контроля</option>
            {controls.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" onClick={() => { setQuery(''); setControl('') }}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={columns} rows={filtered} />
      <ModalForm
        open={Boolean(modal)}
        title={modal?.id ? 'Изменить дисциплину' : 'Новая дисциплина'}
        onClose={() => setModal(null)}
        onSubmit={save}
        busy={busy}
      >
        <Field label="Название">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Лекции, часов">
          <input className="input" type="number" value={form.lectures} onChange={(e) => setForm({ ...form, lectures: e.target.value })} />
        </Field>
        <Field label="Практики, часов">
          <input className="input" type="number" value={form.practice} onChange={(e) => setForm({ ...form, practice: e.target.value })} />
        </Field>
        <Field label="Лабораторные, часов">
          <input className="input" type="number" value={form.labs} onChange={(e) => setForm({ ...form, labs: e.target.value })} />
        </Field>
        <Field label="Форма контроля">
          <select className="select" value={form.control} onChange={(e) => setForm({ ...form, control: e.target.value })}>
            <option>Экзамен</option>
            <option>Зачёт</option>
            <option>Диф. зачёт</option>
          </select>
        </Field>
      </ModalForm>
    </div>
  )
}
