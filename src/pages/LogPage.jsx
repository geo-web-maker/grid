// src/pages/LogPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { submitMaintenanceLog } from '../lib/firestoreService'
import { fetchPartsCatalogue } from '../lib/adminService'
import useAppStore from '../store/useAppStore'

export default function LogPage() {
  const { assetCode }    = useParams()
  const navigate         = useNavigate()
  const { user, isOnline, addTconst { user, userProfile, isOnline, addToast } = useAppStore()
  const canSubmit = ['head_of_department', 'technician', 'supervisor'].includes(userProfile?.role)oast } = useAppStore()
  const [photos, setPhotos]       = useState([])
  const [submitting, setSub]      = useState(false)
  const [catalogue, setCatalogue] = useState([])
  const fileRef = useRef()

  useEffect(() => {
    fetchPartsCatalogue().then(setCatalogue).catch(() => {})
  }, [])

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      type:          'preventive',
      duration_hours: '',
      work_performed: '',
      findings:       '',
      parts:          [{ part_name: '', part_code: '', quantity_used: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'parts' })

  const onPhotoChange = (e) => {
    const files = Array.from(e.target.files)
    setPhotos((prev) => [...prev, ...files].slice(0, 5))
  }

  const onSubmit = async (data) => {
    setSub(true)
    try {
      const parts = data.parts.filter((p) => p.part_name?.trim())
      const result = await submitMaintenanceLog(
        {
          asset_id:       assetCode || 'UNKNOWN',
          technician_id:  user?.uid || 'demo',
          type:           data.type,
          work_performed: data.work_performed,
          findings:       data.findings,
          duration_hours: data.duration_hours,
          logged_at:      new Date().toISOString(),
        },
        photos,
        parts
      )

      addToast(
        result.synced ? 'Log submitted successfully' : 'Log saved offline — will sync when online',
        result.synced ? 'success' : 'warning'
      )
      navigate(-1)
    } catch (err) {
      addToast('Failed to save log. Please try again.', 'error')
    } finally {
      setSub(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <div className="scroll-area">
        {/* Asset banner */}
        {assetCode && (
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3.5 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#185FA5" strokeWidth="1.5">
              <circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/>
            </svg>
            <div className="flex-1">
              <p className="text-xs font-mono font-medium text-navy-800">{assetCode}</p>
              <p className="text-xs text-blue-600">Tap to change asset</p>
            </div>
            <span className="badge badge-green">Active</span>
          </div>
        )}

        {/* Offline warning */}
        {!isOnline && (
          <div className="flex gap-2.5 items-start bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#854F0B" strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
              <path d="M8 1l7 13H1L8 1z"/><path d="M8 6v4M8 12v.5"/>
            </svg>
            <p className="text-xs text-amber-700">You're offline. This entry will be saved locally and synced when connectivity returns.</p>
          </div>
        )}

        {/* Read-only notice for lecturer and student */}
        {!canSubmit && (
          <div className="flex gap-2.5 items-start bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-3">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#185FA5" strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7"/><path d="M8 7v4M8 5v.5"/>
            </svg>
            <p className="text-xs text-blue-700">
              Your role has read-only access. You can view this record but cannot submit changes.
            </p>
          </div>
        )}

        {/* Maintenance record */}
        <div className="card flex flex-col gap-4">
          <h3 className="text-sm font-medium text-gray-900">Maintenance record</h3>

          <div className="field">
            <label>Maintenance type</label>
              <select {...register('type', { required: true })}>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="overhaul">Overhaul</option>
                <option value="inspection">Inspection</option>
                <option value="emergency">Emergency</option>
              </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>Date</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} {...register('date')} />
            </div>
            <div className="field">
              <label>Duration (hrs)</label>
              <input type="number" step="0.5" placeholder="e.g. 2.5" {...register('duration_hours')} />
            </div>
          </div>

          <div className="field">
            <label>Work performed *</label>
            <textarea
              placeholder="Describe what was done..."
              {...register('work_performed', { required: 'Required' })}
            />
            {errors.work_performed && <p className="text-red-500 text-xs">{errors.work_performed.message}</p>}
          </div>

          <div className="field">
            <label>Findings, recurring problems & observations</label>
            <textarea placeholder="Anomalies, wear, recurring issues, missing parts..." style={{ minHeight: 60 }} {...register('findings')} />
          </div>
        </div>

        {/* Photo evidence */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Photo evidence</h3>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={onPhotoChange} />

          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {photos.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.5"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-gray-300 rounded-xl py-4 flex flex-col items-center gap-1.5 text-gray-400 active:bg-gray-50"
          >
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="14" height="10" rx="1"/><circle cx="8" cy="9" r="2.5"/><path d="M5 4l1-2h4l1 2"/>
            </svg>
            <span className="text-xs">Tap to capture photo</span>
            <span className="text-[10px] text-gray-300">Auto-compressed · max 5 photos</span>
          </button>
        </div>

        {/* Spare parts */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Spare parts used</h3>
          {/* Parts catalogue datalist — populated from admin catalogue */}
          <datalist id="parts-catalogue">
            {catalogue.map(p => (
              <option key={p.id} value={p.name}>{p.part_code} · per {p.unit}</option>
            ))}
          </datalist>

          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <input
                  placeholder="Part name or code"
                  list="parts-catalogue"
                  className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-800"
                  {...register(`parts.${index}.part_name`)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  className="w-16 text-xs px-2 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-800 text-center"
                  {...register(`parts.${index}.quantity_used`)}
                />
                {index > 0 && (
                  <button type="button" onClick={() => remove(index)} className="text-gray-300 mt-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l12 12M13 1L1 13"/></svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ part_name: '', quantity_used: '' })}
              className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl py-2 text-center"
            >
              + Add part
            </button>
          </div>
        </div>
      </div>

      {/* Submit bar */}
      <div className="grid grid-cols-2 gap-2.5 p-3.5 border-t border-gray-100 bg-white">
        <button type="button" className="btn-secondary text-sm" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="btn-success text-sm disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Submit log'}
        </button>
      </div>
    </form>
  )
}
