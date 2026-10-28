'use client'

import { createContext, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const api = useMemo(() => ({
    /** type: 'ok' (обычное) или 'error' (красное). Исчезает через 2.8 секунды. */
    show(message, type = 'ok') {
      const id = Date.now() + Math.random()
      setItems((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }, 2800)
    },
  }), [])

  return (
    <ToastContext value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast ${item.type}`}>{item.message}</div>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast только внутри ToastProvider')
  return ctx
}
