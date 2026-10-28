'use client'

import { api, downloadCsv } from "@/api";
import { Button, PageHeader, Table, Toolbar } from "@/components/UI/primitives";
import { useToast } from "@/components/UI/Toast";
import { displayFinal, formatGrade, gradeColor, isPassed } from "@/lib/grades";
import { useEffect, useMemo, useState } from "react";

function GradeField({ value, onChange, disabled }) {
  return (
    <input
      className="grade-input"
      inputMode="numeric"
      maxLength={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value, false)}
      onBlur={(e) => onChange(e.target.value, true)}
    />
  )
}

export default function GradesPage() {
  const toast = useToast()
  const [assignments, setAssignments] = useState([])
  const [assignmentId, setAssignmentId] = useState('')
  const [rows, setRows] = useState([])
  const [control, setControl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getAssignments().then((list) => {
      setAssignments(list)
      if (list[0]) setAssignmentId(String(list[0].id))
    }).catch((err) => toast.show(err.message, 'error'))
  }, [toast])

  const current = assignments.find((item) => String(item.id) === String(assignmentId))

  useEffect(() => {
    if (!assignmentId) return
    api.getJournal(assignmentId).then((data) => {
      setRows(data.rows)
      setControl(data.assignment.control)
    }).catch((err) => toast.show(err.message, 'error'))
  }, [assignmentId, toast])

  const semesters = [...new Set(assignments.map((item) => item.semester))]
  const groups = [...new Set(assignments.filter((item) => !current || item.semester === current.semester).map((item) => item.group))]
  const disciplines = assignments.filter((item) => (
    current && item.semester === current.semester && item.group === current.group
  ))

  function patch(id, key, raw, clamp) {
    const trimmed = String(raw).trim()
    let next = trimmed
    if (trimmed !== '') {
      const value = Number(trimmed)
      if (!Number.isFinite(value)) return
      next = clamp ? Math.min(5, Math.max(2, Math.round(value))) : trimmed
    }
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: next } : row)))
  }

  async function save() {
    setBusy(true)
    try {
      const data = await api.saveJournal(assignmentId, rows)
      setRows(data.rows)
      toast.show('Оценки сохранены')
    } catch (err) {
      toast.show(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const columns = useMemo(() => {
    const passFail = control === 'Зачёт'
    return [
      { key: 'n', label: '№', render: (_row, index) => index + 1 },
      { key: 'fio', label: 'ФИО студента' },
      ...(!passFail ? [
        { key: 'lab', label: 'Лаб.', render: (row) => <GradeField value={row.lab} onChange={(raw, clamp) => patch(row.id, 'lab', raw, clamp)} /> },
        { key: 'coursework', label: 'КР', render: (row) => <GradeField value={row.coursework} onChange={(raw, clamp) => patch(row.id, 'coursework', raw, clamp)} /> },
      ] : []),
      { key: 'exam', label: passFail ? 'Зачёт' : 'Экзамен', render: (row) => <GradeField value={row.exam} onChange={(raw, clamp) => patch(row.id, 'exam', raw, clamp)} /> },
      { key: 'final', label: 'Итог', className: 'num', render: (row) => {
        const total = displayFinal(row, control)
        if (typeof total === 'string') return <span className={total === 'зачтено' ? 'green' : total === 'незачтено' ? 'red' : ''}>{total}</span>
        return <span className={gradeColor(total)}>{formatGrade(total)}</span>
      } },
      { key: 'status', label: 'Статус', render: (row) => {
        const total = displayFinal(row, control)
        if (total === '—') return '—'
        const ok = typeof total === 'string' ? total === 'зачтено' : isPassed(total)
        return <span className={ok ? 'green' : 'red'}>{ok ? 'Сдано' : 'Неуд.'}</span>
      } },
    ]
  }, [control])

  return (
    <div className="container">
      <PageHeader title="Выставление оценок" subtitle="Журнал по дисциплине" />
      <Toolbar actions={(
        <div className="toolbarActions">
          <Button variant="ghost" onClick={() => downloadCsv(
            'journal.csv',
            ['ФИО', 'Лаб.', 'КР', 'Экзамен'],
            rows.map((row) => [row.fio, row.lab, row.coursework, row.exam]),
          )}>Экспорт в Excel</Button>
          <Button onClick={save} disabled={busy || !assignmentId}>{busy ? 'Сохранение…' : 'Сохранить'}</Button>
        </div>
      )}>
        <div className="selectBlock">
          <select
            className="select"
            value={current?.semester ?? ''}
            onChange={(e) => {
              const next = assignments.find((item) => item.semester === e.target.value)
              if (next) setAssignmentId(String(next.id))
            }}
          >
            {semesters.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="selectBlock">
          <select
            className="select"
            value={current?.group ?? ''}
            onChange={(e) => {
              const next = assignments.find((item) => item.semester === current?.semester && item.group === e.target.value)
              if (next) setAssignmentId(String(next.id))
            }}
          >
            {groups.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="selectBlock">
          <select className="select" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
            {disciplines.map((item) => (
              <option key={item.id} value={item.id}>{item.discipline}</option>
            ))}
          </select>
        </div>
        {current ? <span className="badge">{current.control}</span> : null}
      </Toolbar>
      <p className="meta-line">Веса: Лаб. 0.3 · КР 0.3 · Экзамен 0.4. Зачёт в средний балл не входит.</p>
      <Table columns={columns} rows={rows} />
    </div>
  )
}
