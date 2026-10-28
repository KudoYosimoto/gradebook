'use client'

import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { PageHeader, Table } from "@/components/UI/primitives";
import { gradeColor } from "@/lib/grades";
import { useEffect, useState } from "react";

const COLUMNS = [
  { key: 'discipline', label: 'Дисциплина' },
  { key: 'teacher', label: 'Преподаватель' },
  { key: 'control', label: 'Контроль' },
  { key: 'lab', label: 'Лаб.' },
  { key: 'coursework', label: 'КР' },
  { key: 'final', label: 'Итог', render: (row) => (
    typeof row.final === 'string'
      ? <span className={row.final === 'зачтено' ? 'badge ok' : 'badge bad'}>{row.final}</span>
      : <span className={gradeColor(row.final)}>{row.final ?? '—'}</span>
  ) },
]

export default function MePage() {
  const { user } = useAuth()
  const [data, setData] = useState({ rows: [], gpa: null, place: null, total: 0, debts: 0, semester: '—', student: { group: '' } })

  useEffect(() => {
    api.getMyGrades().then(setData).catch(() => {})
  }, [])

  return (
    <div className="container">
      <PageHeader
        title="Моя успеваемость"
        subtitle={`${user.name} · Группа ${data.student.group || user.groupName || '—'}`}
      />
      <section className="stats">
        <div className="stat">
          <p className="title">Средний балл</p>
          <p className={`statValue ${gradeColor(data.gpa) || 'blue'}`}>{data.gpa == null ? '—' : Number(data.gpa).toFixed(2)}</p>
        </div>
        <div className="stat">
          <p className="title">Место в группе</p>
          <p className="statValue">{data.place ? `${data.place} из ${data.total}` : '—'}</p>
        </div>
        <div className="stat">
          <p className="title">Долгов</p>
          <p className={`statValue ${data.debts ? 'red' : 'green'}`}>{data.debts}</p>
        </div>
        <div className="stat">
          <p className="title">Семестр</p>
          <p className="statValue">{data.semester}</p>
        </div>
      </section>
      <Table columns={COLUMNS} rows={data.rows} />
    </div>
  )
}
