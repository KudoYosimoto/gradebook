'use client'

import { api, downloadCsv } from "@/api";
import { Button, PageHeader, Table, Toolbar } from "@/components/UI/primitives";
import { useToast } from "@/components/UI/Toast";
import { displayFinal, formatGrade, gradeColor, isPassed, statusColor } from "@/lib/grades";
import { useEffect, useMemo, useState } from "react";

const TABS = ['Рейтинг группы', 'Ведомость', 'Сводка студента', 'Должники', 'Качество знаний']

function Select({ value, onChange, options, empty, labelKey = 'name', valueKey = 'id' }) {
  return (
    <div className="selectBlock">
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {empty ? <option value="">{empty}</option> : null}
        {options.map((item) => (
          <option key={item[valueKey] ?? item} value={item[valueKey] ?? item}>{item[labelKey] ?? item}</option>
        ))}
      </select>
    </div>
  )
}

export default function ReportsPage() {
  const toast = useToast()
  const [tab, setTab] = useState(TABS[0])
  const [lookups, setLookups] = useState({ groups: [], semesters: [], students: [], disciplines: [] })
  const [assignments, setAssignments] = useState([])
  const [groupId, setGroupId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [pickedAssignment, setAssignmentId] = useState('')
  const [pickedStudent, setStudentId] = useState('')
  const [result, setResult] = useState({ key: '', rows: [], meta: null })
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    Promise.all([api.getLookups(), api.getAssignments()]).then(([look, list]) => {
      setLookups(look)
      setAssignments(list)
      setGroupId(String(look.groups[0]?.id ?? ''))
      setSemesterId(String(look.semesters[0]?.id ?? ''))
    }).catch((err) => toast.show(err.message, 'error'))
  }, [toast])

  const groupAssignments = assignments.filter((item) => (
    String(item.group_id) === String(groupId) && String(item.semester_id) === String(semesterId)
  ))
  const groupStudents = lookups.students.filter((item) => {
    const group = lookups.groups.find((g) => String(g.id) === String(groupId))
    return group && item.group_name === group.name
  })

  const activeAssignmentId = groupAssignments.some((item) => String(item.id) === String(pickedAssignment))
    ? pickedAssignment
    : String(groupAssignments[0]?.id ?? '')
  const activeStudentId = groupStudents.some((item) => String(item.id) === String(pickedStudent))
    ? pickedStudent
    : String(groupStudents[0]?.id ?? '')

  const query = useMemo(() => {
    if (!groupId || !semesterId) return null
    if (tab === 'Ведомость') return activeAssignmentId ? { type: 'sheet', assignmentId: activeAssignmentId } : null
    if (tab === 'Сводка студента') return activeStudentId ? { type: 'student', studentId: activeStudentId } : null
    const type = tab === 'Должники' ? 'debts' : tab === 'Качество знаний' ? 'quality' : 'ranking'
    return { type, groupId, semesterId }
  }, [tab, groupId, semesterId, activeAssignmentId, activeStudentId])
  const queryKey = query ? `${tab}|${JSON.stringify(query)}` : ''

  useEffect(() => {
    if (!query) return
    let cancelled = false
    api.getReports(query).then((data) => {
      if (cancelled) return
      if (query.type === 'sheet') setResult({ key: queryKey, rows: data.rows, meta: data.assignment })
      else if (query.type === 'student') setResult({ key: queryKey, rows: data.rows, meta: null })
      else setResult({ key: queryKey, rows: data, meta: null })
    }).catch((err) => toast.show(err.message, 'error'))
    return () => { cancelled = true }
  }, [query, queryKey, refresh, toast])
  
  const rows = useMemo(() => (result.key === queryKey ? result.rows : []), [result, queryKey])
  const sheetMeta = result.key === queryKey ? result.meta : null
  const table = useMemo(() => {
    if (tab === 'Ведомость') {
      return {
        columns: [
          { key: 'n', label: '№', render: (_row, index) => index + 1 },
          { key: 'fio', label: 'ФИО' },
          { key: 'lab', label: 'Лаб.' },
          { key: 'coursework', label: 'КР' },
          { key: 'exam', label: 'Экзамен' },
          { key: 'final', label: 'Итог', className: 'num', render: (row) => {
            const total = displayFinal(row, sheetMeta?.control)
            if (typeof total === 'string') return <span className={total === 'зачтено' ? 'green' : ''}>{total}</span>
            return <span className={gradeColor(total)}>{formatGrade(total)}</span>
          } },
          { key: 'status', label: 'Статус', render: (row) => {
            const total = displayFinal(row, sheetMeta?.control)
            const ok = typeof total === 'string' ? total === 'зачтено' : isPassed(total)
            return <span className={ok ? 'green' : 'red'}>{ok ? 'Сдано' : 'Неуд.'}</span>
          } },
        ],
        rows,
      }
    }
    if (tab === 'Сводка студента') {
      return {
        columns: [
          { key: 'discipline', label: 'Дисциплина' },
          { key: 'teacher', label: 'Преподаватель' },
          { key: 'control', label: 'Контроль' },
          { key: 'lab', label: 'Лаб.' },
          { key: 'coursework', label: 'КР' },
          { key: 'final', label: 'Итог', render: (row) => (
            typeof row.final === 'string'
              ? <span className={row.final === 'зачтено' ? 'green' : row.final === 'незачтено' ? 'red' : ''}>{row.final}</span>
              : <span className={gradeColor(row.final)}>{row.final}</span>
          ) },
        ],
        rows,
      }
    }
    return {
      columns: [
        { key: 'place', label: 'Место' },
        { key: 'fio', label: 'ФИО' },
        { key: 'gpa', label: 'Ср. балл', className: 'num', render: (row) => (
          <span className={gradeColor(row.gpa)}>{row.gpa == null ? '—' : Number(row.gpa).toFixed(2)}</span>
        ) },
        { key: 'debts', label: 'Долгов' },
        { key: 'quality', label: 'Качество', render: (row) => (
          <span className={statusColor(row.quality ? 'Да' : 'Нет')}>{row.quality ? 'Да' : 'Нет'}</span>
        ) },
      ],
      rows,
    }
  }, [tab, rows, sheetMeta])

  function exportExcel() {
    if (tab === 'Сводка студента') {
      downloadCsv('student.csv', ['Дисциплина', 'Контроль', 'Итог'], rows.map((row) => [row.discipline, row.control, row.final]))
    } else if (tab === 'Ведомость') {
      downloadCsv('sheet.csv', ['ФИО', 'Лаб.', 'КР', 'Экзамен'], rows.map((row) => [row.fio, row.lab, row.coursework, row.exam]))
    } else {
      downloadCsv('ranking.csv', ['Место', 'ФИО', 'Ср. балл', 'Долгов'], rows.map((row) => [row.place, row.fio, row.gpa, row.debts]))
    }
  }

  return (
    <div className="container">
      <PageHeader title="Отчёты и аналитика" subtitle="Ведомости, рейтинг, должники" />
      <div className="tabs">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            className={tab === name ? 'tab active' : 'tab'}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <Toolbar actions={(
        <div className="toolbarActions">
          <Button onClick={() => setRefresh((n) => n + 1)}>Сформировать</Button>
          <Button variant="ghost" onClick={() => window.print()}>Печать</Button>
          <Button variant="ghost" onClick={exportExcel}>Excel</Button>
          <Button variant="ghost" onClick={() => window.print()}>PDF</Button>
        </div>
      )}>
        {tab === 'Сводка студента' ? (
          <>
            <Select value={groupId} onChange={setGroupId} options={lookups.groups} />
            <Select value={activeStudentId} onChange={setStudentId} options={groupStudents} labelKey="fio" />
          </>
        ) : null}
        {tab === 'Ведомость' ? (
          <>
            <Select value={groupId} onChange={setGroupId} options={lookups.groups} />
            <Select value={semesterId} onChange={setSemesterId} options={lookups.semesters} />
            <Select value={activeAssignmentId} onChange={setAssignmentId} options={groupAssignments} labelKey="discipline" />
          </>
        ) : null}
        {tab === 'Рейтинг группы' || tab === 'Должники' || tab === 'Качество знаний' ? (
          <>
            <Select value={groupId} onChange={setGroupId} options={lookups.groups} />
            <Select value={semesterId} onChange={setSemesterId} options={lookups.semesters} />
          </>
        ) : null}
      </Toolbar>
      <Table columns={table.columns} rows={table.rows} />
    </div>
  )
}
