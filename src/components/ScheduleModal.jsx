// src/pages/admin/ScheduleAdmin.jsx
import { useEffect, useState } from 'react'
import { fetchScheduledTasks } from '../../lib/firestoreService'
import { scheduleTask, fetchAllAssetsAdmin } from '../../lib/adminService'
import useAppStore from '../../store/useAppStore'

const STATUS_BADGE = {
  pending:   'badge-amber',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

const TASK_TYPES = ['preventive', 'corrective', 'inspection', 'overhaul']

export default function ScheduleAdmin() {
  const { addToast }            = useAppStore()
  const [tasks,    setTasks]    = useState([])
  const [assets,   setAssets]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({
    asset_id:      '',
    scheduled_for: '',
    task_type:     'preventive',
    notes:         '',
  })

  useEffect(() => {
    Promise.all([
      fetchScheduledTasks(),
      fetchAllAssetsAdmin(),
    ]).then(([t, a]) => {
      setTasks(t)
      setAssets(a)
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.asset_id || !form.scheduled_for) {
      addToast('Asset and date are required', 'warning')
      return
    }
    setSaving(true)
    try {
      await scheduleTask(form)
      addToast('Task scheduled', 'success')
      setShowForm(false)
      setForm({ asset_id: '', scheduled_for: '', task_type: 'preventive', notes: '' })
      const updated = await fetchScheduledTasks()
      setTasks(updated)
    } catch (err) {
      addToast(err.message || 'Failed to schedule task', 'error')
    } finally {
      setSaving(false)
    }
  }

  const assetName = (id) => {
    const a = assets.find(a => a.id === id)
    return a ? `${a.name} (${a.asset_code})` : id
  }

  return (
    <div className="scroll-area">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Scheduled tasks</p>
          <p className="text-xs text-gray-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm px-4 py-2.5"
        >
          {showForm ? 'Cancel' : '+ Schedule task'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card flex flex-col gap-4">
          <h3 className="text-sm font-medium text-gray-900">New scheduled task</h3>

          <div className="field">
            <label>Asset *</label>
            <select
              value={form.asset_id}
              onChange={e => setForm({ ...form, asset_id: e.target.value })}
            >
              <option value="">Select asset</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.asset_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>Scheduled date *</label>
              <input
                type="date"
                value={form.scheduled_for}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, scheduled_for: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Task type</label>
              <select
                value={form.task_type}
                onChange={e => setForm({ ...form, task_type: e.target.value })}
              >
                {TASK_TYPES.map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea
              placeholder="Optional instructions or details..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ minHeight: 72 }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary w-full disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))
      ) : tasks.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-400">No tasks scheduled yet</p>
          <p className="text-xs text-gray-300 mt-1">Use the button above to schedule one</p>
        </div>
      ) : (
        tasks.map(task => (
          <div key={task.id} className="card flex items-start gap-3">
            {/* Date block */}
            <div className="w-10 flex-shrink-0 text-center">
              <p className="text-lg font-mono font-semibold text-navy-800 leading-none">
                {task.scheduled_for?.split('-')[2] || '—'}
              </p>
              <p className="text-[10px] text-gray-400 uppercase">
                {task.scheduled_for
                  ? new Date(task.scheduled_for + 'T00:00:00').toLocaleDateString('en-UG', { month: 'short' })
                  : ''}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {assetName(task.asset_id)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                {task.task_type} maintenance
              </p>
              {task.notes && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.notes}</p>
              )}
            </div>

            <span className={`badge ${STATUS_BADGE[task.status] || 'badge-gray'} flex-shrink-0`}>
              {task.status}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
