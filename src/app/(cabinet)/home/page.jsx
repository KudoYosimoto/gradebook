'use client'

import { api } from "@/api";
import { PageHeader, Table } from "@/components/UI/primitives";
import { gradeColor } from "@/lib/grades";
import { useEffect, useState } from "react";

const COLUMNS = [
  { key: 'time', label: 'Время' },
  { key: 'user', label: 'Пользователь' },
  { key: 'action', label: 'Действие' },
]

export default function HomePage() {
  const [data, setData] = useState({
    semester: '—',
    students: 0,
    groups: 0,
    gpa: 0,
    debts: 0,
    quality: 0,
    recent: [],
  })

  useEffect(() => {
    api.getStats().then(setData).catch(() => {})
  }, [])

  const stats = [
    { title: 'Студенты', value: data.students, color: 'white', subtitle: `${data.groups} групп` },
    { title: 'Средний балл', value: data.gpa, color: gradeColor(data.gpa) || 'blue', subtitle: 'по всем группам' },
    { title: 'Должников', value: data.debts, color: data.debts ? 'red' : 'green', subtitle: 'неудовлетворительные оценки' },
    { title: 'Качество знаний', value: `${data.quality}%`, color: 'green', subtitle: 'оценки «4» и «5»' },
  ]

  return (
    <div className="container">
      <PageHeader title="Обзор" subtitle={`Сводка по текущему семестру · ${data.semester}`}/>
      <section className="stats">
          {stats.map((stat) => (
              <div className="stat" key={stat.title}>
                  <p className="title">{stat.title}</p>
                  <p className={`statValue ${stat.color}`}>{stat.value}</p>
                  <p className="title">{stat.subtitle}</p>
              </div>
          ))}
      </section>
      <Table columns={COLUMNS} rows={data.recent}/>
    </div>
  )
}
