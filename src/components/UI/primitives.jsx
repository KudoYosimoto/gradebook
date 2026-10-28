'use client'

import { Icon } from "./Icon";

/** Кнопка. variant="ghost" — второстепенная (прозрачная). По умолчанию type="button", чтобы не отправлять форму. */
export function Button({ variant = '', className = '', ...props }) {
  const extra = variant === 'ghost' ? 'btnGhost' : ''
  return <button className={`btn ${extra} ${className}`} type={props.type || 'button'} {...props} />
}

export function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1>{title}</h1>
      <div>
        {subtitle ? <span className="subtitle">{subtitle}</span> : null}
      </div>
    </div>
  )
}

/** Поле поиска. Значение и setQuery приходят со страницы — фильтрует страница. */
export function Search({ placeholder, query, setQuery }) {
  return (
    <div className="search">
      <Icon className="Icon" name="search" />
      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}

/** Панель над таблицей: слева фильтры (children), справа кнопки действий (actions). */
export function Toolbar({ children, actions }) {
  return (
    <div className="toolbar">
      <div className="filterBlock">{children}</div>
      {actions ?? null}
    </div>
  )
}

export function Table({ columns, rows = [] }) {
  return (
    <section className="card">
      <table className="data">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className ?? ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty">Нет записей</td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((col) => (
                <td key={col.key} className={col.className ?? ''}>
                  {col.render ? col.render(row, index) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* По ТЗ пустой результат подписывается «1–0 из 0» */}
      <div className="pager">
        <span>1–{rows.length} из {rows.length}</span>
      </div>
    </section>
  )
}

/** Кнопки «Изменить / Удалить» в строке. Не передан обработчик — кнопки нет. */
export function RowActions({ onEdit, onDelete }) {
  if (!onEdit && !onDelete) return '—'
  return (
    <div className="row-actions">
      {onEdit ? <button type="button" className="link-btn" onClick={onEdit}>Изменить</button> : null}
      {onDelete ? <button type="button" className="link-btn danger" onClick={onDelete}>Удалить</button> : null}
    </div>
  )
}
