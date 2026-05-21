// src/pages/admin/AssetsAdmin.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  fetchAllAssetsAdmin, createAsset,
  updateAsset, deleteAsset, fetchAllSites,
  fetchCategories, fetchAssetStatuses,
} from '../../lib/adminService'
import { generateQRDataUrl, printQRTag, downloadQRPng } from '../../lib/qrGenerator'
import useAppStore from '../../store/useAppStore'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

const STATUS_BADGE = {
  operational:    'badge-green',
  maintenance:    'badge-amber',
  overdue:        'badge-red',
  decommissioned: 'badge-gray',
}

export default function AssetsAdmin() {
  const { addToast }         = useAppStore()
  const [assets, setAssets]  = useState([])
  const [sites,  setSites]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing,   setEditing]     = useState(null)
  const [deleting,  setDeleting]    = useState(null)
  const [qrPreview, setQrPreview]   = useState(null) // { asset, dataUrl }
  const [search,    setSearch]      = useState('')
  const [catFilter, setCatFilter]   = useState('All')
  const [categories, setCategories] = useState([])
  const [statusOpts, setStatusOpts] = useState(['operational','maintenance','overdue','decommissioned'])

  
useEffect(() => {
  Promise.all([
    fetchAllAssetsAdmin(),
    fetchAllSites(),
    fetchCategories(),
    fetchAssetStatuses(),
  ])
    .then(([a, s, cats, statuses]) => {
      setAssets(a)
      setSites(s)
      setCategories(cats)                                    // ← from DB
      if (statuses.length) setStatusOpts(statuses)          // ← from DB, fallback to default
    })
    .finally(() => setLoading(false))
}, [])

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit   = (a) => { setEditing(a); setShowModal(true) }

  const openQR = async (asset) => {
    const dataUrl = await generateQRDataUrl(asset.asset_code, 300)
    setQrPreview({ asset, dataUrl })
  }

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateAsset(editing.id, data)
        setAssets(a => a.map(x => x.id === editing.id ? { ...x, ...data } : x))
        addToast('Asset updated', 'success')
      } else {
        const asset = await createAsset(data)
        setAssets(a => [...a, asset])
        addToast(`Asset ${asset.asset_code} registered`, 'success')
        // Auto-open QR preview for new asset
        const dataUrl = await generateQRDataUrl(asset.asset_code, 300)
        setQrPreview({ asset, dataUrl })
      }
      setShowModal(false)
    } catch (err) {
      addToast(err.message || 'Failed to save asset', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAsset(deleting.id)
      setAssets(a => a.filter(x => x.id !== deleting.id))
      addToast('Asset removed', 'success')
    } catch {
      addToast('Failed to delete asset', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = assets.filter(a => {
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.site_id?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || a.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="scroll-area">
        {/* Search + add */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 whitespace-nowrap">
            + Register
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors capitalize
                ${catFilter === c
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 px-1">{filtered.length} asset{filtered.length !== 1 ? 's' : ''}</p>

        {/* List */}
        {loading ? (
          Array.from({length:4}).map((_,i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-3">No assets registered yet</p>
            <button onClick={openCreate} className="btn-primary text-sm">Register first asset</button>
          </div>
        ) : (
          filtered.map(asset => (
            <div key={asset.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#185FA5" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                    <span className={`badge ${STATUS_BADGE[asset.status] || 'badge-gray'}`}>
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{asset.asset_code}</p>
                  <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                    <span className="capitalize">{asset.category}</span>
                    <span>·</span>
                    <span>{asset.site_id}</span>
                    <span>·</span>
                    <span>PM every {asset.pm_interval_days}d</span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => openQR(asset)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium
                    text-navy-700 bg-blue-50 rounded-xl"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 4V2a1 1 0 011-1h2M12 1h2a1 1 0 011 1v2M15 12v2a1 1 0 01-1 1h-2M4 15H2a1 1 0 01-1-1v-2M4 8h8"/>
                  </svg>
                  QR Code
                </button>
                <button
                  onClick={() => openEdit(asset)}
                  className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-xl"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleting(asset)}
                  className="px-3 py-2 text-xs font-medium text-red-500 bg-red-50 rounded-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Asset form modal */}
      {showModal && (
        <AssetModal
          asset={editing}
          sites={sites}
          categories={categories}
          statusOpts={statusOpts}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* QR Preview modal */}
      {qrPreview && (
        <QRPreviewModal
          asset={qrPreview.asset}
          dataUrl={qrPreview.dataUrl}
          onClose={() => setQrPreview(null)}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          message={`Permanently delete ${deleting.name} (${deleting.asset_code})? This cannot be undone and will remove all associated maintenance logs.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function AssetModal({ asset, sites, categories, statusOpts, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: asset || {
      name: '', category: 'other', site_id: '',
      make: '', model: '', serial_number: '', year_acquired: '',
      pm_interval_days: 60, status: 'operational', notes: '',
    },
  })

  const onSubmit = async (data) => {
    setSaving(true)
    await onSave(data)
    setSaving(false)
  }

  return (
    <Modal
      title={asset ? 'Edit asset' : 'Register new asset'}
      onClose={onClose}
      footer={
        <button type="submit" form="asset-form" disabled={saving} className="btn-primary w-full disabled:opacity-60">
          {saving ? 'Saving…' : asset ? 'Save changes' : 'Register asset'}
        </button>
      }
    >
      <form id="asset-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Name */}
        <div className="field">
          <label>Asset name / description *</label>
          <input placeholder="e.g. Milford 14&quot; Pedestal Grinder"
            {...register('name', { required: 'Required' })} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        {/* Make + Model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Make / Brand</label>
            <input placeholder="e.g. Vemack"
              {...register('make')} />
          </div>
          <div className="field">
            <label>Model</label>
            <input placeholder="e.g. UF25D"
              {...register('model')} />
          </div>
        </div>

        {/* Serial + Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Serial number</label>
            <input placeholder="e.g. 20183009N"
              {...register('serial_number')} />
          </div>
          <div className="field">
            <label>Year acquired</label>
            <input placeholder="e.g. 2019"
              {...register('year_acquired')} />
          </div>
        </div>

        {/* Category + Site */}
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Category *</label>
            <select {...register('category', { required: true })}>
              {(categories || []).filter(c => c !== 'All').map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Site / Location *</label>
            <select {...register('site_id', { required: 'Required' })}>
              <option value="">Select site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.site_id && <p className="text-red-500 text-xs">{errors.site_id.message}</p>}
          </div>
        </div>

        {/* PM interval + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>PM interval (days) *</label>
            <input type="number" min="1"
              {...register('pm_interval_days', { required: true, min: 1 })} />
          </div>
          <div className="field">
            <label>Current condition</label>
            <select {...register('status')}>
              {(statusOpts || ['operational','maintenance','overdue','decommissioned']).map(s => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="field">
          <label>Notes / observations</label>
          <textarea placeholder="Recurring problems, missing parts, safety issues..."
            {...register('notes')} />
        </div>

        {!asset && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700">
            A unique asset code and QR code will be generated automatically after registration.
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full mt-2 disabled:opacity-60">
          {saving ? 'Saving…' : asset ? 'Save changes' : 'Register asset'}
        </button>
      </form>
    </Modal>
  )
}

function QRPreviewModal({ asset, dataUrl, onClose }) {
  return (
    <Modal title="Asset QR code" onClose={onClose}>
      <div className="flex flex-col items-center gap-5 pb-6">
        {/* QR image */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm">
          <img src={dataUrl} alt={asset.asset_code} className="w-52 h-52" />
        </div>

        {/* Asset info */}
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">{asset.name}</p>
          <p className="text-sm font-mono text-navy-800 mt-1">{asset.asset_code}</p>
          <p className="text-xs text-gray-400 mt-1 capitalize">{asset.category} · {asset.site_id}</p>
        </div>

        {/* Print instructions */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 w-full">
          <p className="font-medium mb-1">Printing recommendation</p>
          Print on <strong>laminated PET</strong> or <strong>aluminium tags</strong> for outdoor durability. Minimum size: 60×60mm for reliable scanning.
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => downloadQRPng(asset)}
            className="flex-1 btn-secondary text-sm"
          >
            Download PNG
          </button>
          <button
            onClick={() => printQRTag(asset)}
            className="flex-1 btn-primary text-sm"
          >
            Print tag
          </button>
        </div>
      </div>
    </Modal>
  )
}
