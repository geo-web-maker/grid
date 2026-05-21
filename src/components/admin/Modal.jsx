// src/components/admin/Modal.jsx
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, footer, wide = false }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col
          ${wide ? 'max-h-[95vh]' : 'max-h-[90vh]'}`}
        style={{ maxWidth: 480 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>

        {/* Pinned footer — submit button lives here */}
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
