'use client'

import { useEffect } from 'react'
import { Button } from './primitives'

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* stopPropagation — клик внутри окна не закрывает его */}
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}

/** Подпись + поле формы. */
export function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

/**
 * Модалка-форма с кнопками «Отмена» и «Сохранить».
 * Enter в поле тоже сохраняет (обычная HTML-форма).
 */
export function ModalForm({ open, title, onClose, onSubmit, children, busy }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => { e.preventDefault(); if (!busy) onSubmit() }}
      >
        {children}
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</Button>
        </div>
      </form>
    </Modal>
  )
}
