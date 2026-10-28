'use client'
import { api } from "@/api";
import { Button, PageHeader, Search, Table, Toolbar } from "@/components/UI/primitives";
import { useToast } from "@/components/UI/Toast";
import { useEffect, useMemo, useRef, useState } from "react";

const COLUMNS = [
  { key: 'time', label: 'Время' },
  { key: 'user', label: 'Пользователь' },
  { key: 'entity', label: 'Сущность' },
  { key: 'action', label: 'Действие' },
  { key: 'details', label: 'Подробности' },
]

export default function AuditPage() {
  const toast = useToast()
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')

  function reload() {
    api.getAuditLog().then(setRows)
  }

  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => rows.filter((item) => {
    const q = query.toLowerCase()
    if (!q) return true
    return item.user.toLowerCase().includes(q)
      || item.entity.toLowerCase().includes(q)
      || item.action.toLowerCase().includes(q)
      || (item.details || '').toLowerCase().includes(q)
  }), [rows, query])

  async function restore(file) {
    if (!file) return
    if (!confirm('Восстановить базу из файла? Текущие данные будут заменены.')) return
    try {
      await api.restoreDb(file)
      toast.show('База восстановлена, обновите страницу')
      reload()
    } catch (err) {
      toast.show(err.message, 'error')
    } finally {
      // Сбрасываем выбранный файл, чтобы можно было загрузить тот же файл ещё раз.
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="container">
      <PageHeader title="Журнал и резервные копии" subtitle="Действия пользователей" />
      <Toolbar actions={(
        <div className="toolbarActions">
          <Button variant="ghost" onClick={() => api.downloadDb().catch((err) => toast.show(err.message, 'error'))}>Скачать БД</Button>
          <Button onClick={() => fileRef.current?.click()}>Восстановить</Button>
          <input
            ref={fileRef}
            type="file"
            accept=".db"
            hidden
            onChange={(e) => restore(e.target.files?.[0])}
          />
        </div>
      )}>
        <Search placeholder="Поиск по журналу" query={query} setQuery={setQuery} />
        <Button variant="ghost" onClick={() => setQuery('')}>
          Сброс
        </Button>
      </Toolbar>
      <Table columns={COLUMNS} rows={filtered} />
    </div>
  )
}
