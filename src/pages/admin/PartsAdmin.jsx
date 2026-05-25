// src/pages/admin/PartsAdmin.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { fetchPartsCatalogue, createPart, updatePart, deletePart } from '../../lib/adminService'
import useAppStore from '../../store/useAppStore'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

const PART_CATEGORIES = [
  'Seals & gaskets',
  'Bearings',
  'Lubricants & oils',
  'Filters',
  'Electrical components',
  'Bolts & fasteners',
  'Pumps & impellers',
  'Brushes & contacts',
  'Valves',
  'Belts & chains',
  'Other',
]

const UNITS = ['piece', 'pair', 'set', 'kg', 'litre', 'metre', 'box']

const CAT_COLORS = {
  'Seals & gaskets':       'bg-blue-50 text-blue-600',
  'Bearings':              'bg-purple-50 text-purple-600',
  'Lubricants & oils':     'bg-amber-50 text-amber-600',
  'Filters':               'bg-teal-50 text-teal-600',
  'Electrical components': 'bg-red-50 text-red-600',
  'Bolts & fasteners':     'bg-gray-100 text-gray-600',
  'Other':                 'bg-gray-50 text-gray-500',
}

export default function PartsAdmin() {
  const { addToast }        = useAppStore()
  const [parts, setParts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [deleting,  setDeleting]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')

  useEffect(() => {
    fetchPartsCatalogue()
      .then(setParts)
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit   = (p) => { setEditing(p); setShowModal(true) }

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updatePart(editing.id, data)
        setParts(p => p.map(x => x.id === editing.id ? { ...x, ...data } : x))
        addToast('Part updated', 'success')
      } else {
        const result = await createPart(data)
        setParts(p => [...p, { id: result.id, ...data }])
        addToast('Part added to catalogue', 'success')
      }
      setShowModal(false)
    } catch (err) {
      addToast(err.message || 'Failed to save part', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePart(deleting.id)
      setParts(p => p.filter(x => x.id !== deleting.id))
      addToast('Part removed from catalogue', 'success')
    } catch {
      addToast('Failed to delete part', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const categories = ['All', ...new Set(parts.map(p => p.category).filter(Boolean))]

  const filtered = parts.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.part_code?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || p.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="scroll-area">
        {/* Search + add */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search parts or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 whitespace-nowrap">
            + Add part
          </button>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors
                ${catFilter === c
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 px-1">
          {filtered.length} part{filtered.length !== 1 ? 's' : ''} in catalogue
        </p>

        {/* Parts list */}
        {loading ? (
          Array.from({length:5}).map((_,i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-3">No parts in catalogue yet</p>
            <button onClick={openCreate} className="btn-primary text-sm">Add first part</button>
          </div>
        ) : (
          filtered.map(part => (
            <div key={part.id} className="card flex items-center gap-3">
              {/* Category dot */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold
                ${CAT_COLORS[part.category] || 'bg-gray-50 text-gray-500'}`}>
                {(part.name || '?')[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{part.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-mono text-gray-400">{part.part_code}</span>
                  {part.category && (
                    <span className="badge badge-gray text-[10px]">{part.category}</span>
                  )}
                  {part.unit && (
                    <span className="text-[10px] text-gray-400">per {part.unit}</span>
                  )}
                </div>
                {part.supplier && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Supplier: {part.supplier}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(part)}
                  className="text-xs text-navy-700 font-medium px-2.5 py-1.5 rounded-lg bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleting(part)}
                  className="text-xs text-red-500 font-medium px-2.5 py-1.5 rounded-lg bg-red-50"
                >
                  Del
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <PartModal
          part={editing}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message={`Remove "${deleting.name}" (${deleting.part_code}) from the catalogue? Existing log records will not be affected.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function PartModal({ part, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: part || {
      name: '', part_code: '', category: '', unit: 'piece', supplier: '', notes: '',
    },
  })

  const onSubmit = async (data) => {
    setSaving(true)
    await onSave(data)
    setSaving(false)
  }

  return (
    <Modal
      title={part ? 'Edit part' : 'Add part to catalogue'}
      onClose={onClose}
      footer={
        <button type="submit" form="part-form" disabled={saving} className="btn-primary w-full disabled:opacity-60">
          {saving ? 'Saving…' : part ? 'Save changes' : 'Add to catalogue'}
        </button>
      }
    >
      <form id="part-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="field">
          <label>Part name *</label>
          <input placeholder="e.g. Bearing seal 45mm"
            {...register('name', { required: 'Required' })} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Part code</label>
            <input placeholder="Auto-generated if blank" {...register('part_code')} />
          </div>
          <div className="field">
            <label>Unit *</label>
            <select {...register('unit', { required: true })}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Category *</label>
          <select {...register('category', { required: 'Required' })}>
            <option value="">Select category</option>
            {PART_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
        </div>

        <div className="field">
          <label>Supplier</label>
          <input placeholder="e.g. Kampala Engineering Supplies" {...register('supplier')} />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea placeholder="Compatible assets, storage conditions, etc."
            {...register('notes')} />
        </div>
      </form>
    </Modal>
  )
}
