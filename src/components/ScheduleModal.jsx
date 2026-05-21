// src/components/ScheduleModal.jsx
import { useEffect, useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { fetchAllAssetsAdmin } from '../lib/adminService'
import useAppStore from '../store/useAppStore'
import Modal from './admin/Modal'

const TASK_TYPES = ['preventive', 'corrective', 'inspection', 'overhaul']

export default function ScheduleModal({ asset, onClose, onScheduled }) {
  const { addToast } = useAppStore()
  const [saving,  setSaving]  = useState(false)
  const [assets,  setAssets]  = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    asset_id:      asset?.id || '',
    scheduled_for: '',
    task_type:     'preventive',
    notes:         '',
  })

  // Fetch all assets from Firestore directly — no backend dependency
  useEffect(() => {
    fetchAllAssetsAdmin()
      .then(setAssets)
      .catch(() => addToast('Could not load assets', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.asset_id) {
      addToast('Please select an asset', 'warning')
      return
    }
    if (!form.scheduled_for) {
      addToast('Please pick a date', 'warning')
      return
    }
  
    setSaving(true)
    try {
      await addDoc(collection(db, 'scheduled_tasks'), {
        asset_id:      form.asset_id,
        scheduled_for: form.scheduled_for,
        task_type:     form.task_type,
        notes:         form.notes || '',
        status:        'pending',
        created_at:    serverTimestamp(),
      })
  
      await addDoc(collection(db, 'reminders'), {
        asset_id:   form.asset_id,
        type:       form.task_type,
        due_date:   form.scheduled_for,
        status:     'pending',
        due_label:  'Scheduled',
        created_at: serverTimestamp(),
      })
  
      onScheduled()
    } catch (err) {
      console.error('scheduleTask error:', err)
      addToast(err.message || 'Failed to schedule task', 'error')
    } finally {
      setSaving(false)
    }
  }

    setSaving(true)
    try {
      // Write directly to Firestore — consistent with the rest of the app
      await addDoc(collection(db, 'scheduled_tasks'), {
        asset_id:      form.asset_id,
        scheduled_for: form.scheduled_for,
        task_type:     form.task_type,
        notes:         form.notes || '',
        status:        'pending',
        created_at:    serverTimestamp(),
      })
      onScheduled()
    } catch (err) {
      console.error('scheduleTask error:', err)
      addToast(err.message || 'Failed to schedule task', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Schedule maintenance task"
      onClose={onClose}
      footer={
        <button
          onClick={handleSubmit}
          disabled={saving || loading}
          className="btn-primary w-full disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">

        {/* Asset selector — pre-selected if opened from asset detail page */}
        <div className="field">
          <label>Asset *</label>
          {loading ? (
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
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
          )}
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

      </div>
    </Modal>
  )
}
