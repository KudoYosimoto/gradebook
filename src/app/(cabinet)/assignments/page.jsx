'use client'
import { api } from "@/api";
import { Button, PageHeader, RowActions, Search, Table, Toolbar } from "@/components/UI/primitives";
import { Field, ModalForm } from "@/components/UI/Modal";
import { useToast } from "@/components/UI/Toast";
import { useEffect, useMemo, useState } from "react";

const EMPTY = { semester_id: '', group_id: '', discipline_id: '', teacher_id: '' }

export default function AssignmentsPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [lookups, setLookups] = useState({ groups: [], disciplines: [], teachers: [], semesters: [] })
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const groups = [...new Set(rows.map((item) => item.group))]

  function reload() {
    api.getAssignments().then(setRows)
    api.getLookups().then(setLookups).catch(() => {})
  }

  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => rows.filter((item) => {
    if (query && !item.discipline.toLowerCase().includes(query.toLowerCase())) return false
    if (group && item.group !== group) return false
    return true
  }), [rows, query, group])

  const columns = [
    { key: 'semester', label: 'Семестр' },
    { key: 'group', label: 'Группа' },
    { key: 'discipline', label: 'Дисциплина' },
    { key: 'teacher', label: 'Преподаватель' },
    { key: 'control', label: 'Контроль' },
    { key: 'actions', label: 'Действия', render: (row) => (
      <RowActions
        onEdit={() => { setForm({ semester_id: row.semester_id, group_id: row.group_id, discipline_id: row.discipline_id, teacher_id: row.teacher_id }); setModal(row) }}
        onDelete={() => remove(row)}
      />
    ) },
  ]

  async function remove(row) {
    if (!confirm(`Снять назначение «${row.discipline}» с группы ${row.group}? Оценки по нему тоже удалятся.`)) return
    try {
      await api.deleteAssignment(row.id)
      toast.show('Назначение удалено')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    }
  }

  async function save() {
    setBusy(true)
    try {
      if (modal?.id) await api.updateAssignment(modal.id, form)
      else await api.createAssignment(form)
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
      <PageHeader title="Назначения" subtitle="Дисциплины группам на семестр" />
      <Toolbar actions={<Button onClick={() => { setForm({ ...EMPTY, semester_id: lookups.semesters[0]?.id || '' }); setModal({}) }}>+ Назначить</Button>}>
        <Search placeholder="Поиск по дисциплине" query={query} setQuery={setQuery} />
        <div className="selectBlock">
          <select className="select" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Все группы</option>
            {groups.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" onClick={() => { setQuery(''); setGroup('') }}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={columns} rows={filtered} />
      <ModalForm
        open={Boolean(modal)}
        title={modal?.id ? 'Изменить назначение' : 'Новое назначение'}
        onClose={() => setModal(null)}
        onSubmit={save}
        busy={busy}
      >
        <Field label="Семестр">
          <select className="select" value={form.semester_id} onChange={(e) => setForm({ ...form, semester_id: e.target.value })}>
            <option value="">Выберите семестр</option>
            {lookups.semesters.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Группа">
          <select className="select" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
            <option value="">Выберите группу</option>
            {lookups.groups.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Дисциплина">
          <select className="select" value={form.discipline_id} onChange={(e) => setForm({ ...form, discipline_id: e.target.value })}>
            <option value="">Выберите дисциплину</option>
            {lookups.disciplines.map((item) => (
              <option key={item.id} value={item.id}>{item.name} · {item.control}</option>
            ))}
          </select>
        </Field>
        <Field label="Преподаватель">
          <select className="select" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">Выберите преподавателя</option>
            {lookups.teachers.map((item) => (
              <option key={item.id} value={item.id}>{item.fio}</option>
            ))}
          </select>
        </Field>
      </ModalForm>
    </div>
  )
}
