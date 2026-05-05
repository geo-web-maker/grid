// src/components/ToastContainer.jsx
import { useEffect } from 'react'
import useAppStore from '../store/useAppStore'

const COLORS = {
  success: 'bg-teal-700 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-navy-800 text-white',
  warning: 'bg-amber-500 text-white',
}

function Toast({ id, message, type }) {
  const removeToast = useAppStore((s) => s.removeToast)

  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 3500)
    return () => clearTimeout(t)
  }, [id])

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        ${COLORS[type] || COLORS.info} animate-[fadeSlideUp_0.2s_ease]`}
    >
      {type === 'success' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
          <path d="M3 8l3 3 7-7" />
        </svg>
      )}
      {message}
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)

  return (
    <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  )
}
