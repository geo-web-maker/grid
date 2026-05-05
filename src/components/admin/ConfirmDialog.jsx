// src/components/admin/ConfirmDialog.jsx
export default function ConfirmDialog({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4
          ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            stroke={danger ? '#DC2626' : '#D97706'} strokeWidth="1.5">
            <path d="M10 2l8 14H2L10 2z"/><path d="M10 8v4M10 14v.5"/>
          </svg>
        </div>
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white
              ${danger ? 'bg-red-600' : 'bg-amber-500'}`}
          >
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
