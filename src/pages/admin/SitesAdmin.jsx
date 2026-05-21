// src/pages/admin/SitesAdmin.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { fetchAllSites, createSite, updateSite } from '../../lib/adminService'
import useAppStore from '../../store/useAppStore'
import Modal from '../../components/admin/Modal'

const REGIONS = ['Central', 'Eastern', 'Northern', 'Western']

export default function SitesAdmin() {
  const { addToast }      = useAppStore()
  const [sites, setSites] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)

  useEffect(() => {
    fetchAllSites()
      .then(setSites)
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit   = (s) => { setEditing(s); setShowModal(true) }

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateSite(editing.id, data)
        setSites(s => s.map(x => x.id === editing.id ? { ...x, ...data } : x))
        addToast('Site updated', 'success')
      } else {
        const result = await createSite(data)
        setSites(s => [...s, { id: result.id, ...data }])
        addToast(`Site "${data.name}" added`, 'success')
      }
      setShowModal(false)
    } catch (err) {
      addToast(err.message || 'Failed to save site', 'error')
    }
  }

  const REGION_COLORS = {
    Central:  'badge-blue',
    East:  'badge-green',
    Northern: 'badge-amber',
    Western:  'badge-purple',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="scroll-area">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-900">Workshop sites</p>
            <p className="text-xs text-gray-400 mt-0.5">{sites.length} registered</p>
          </div>
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5">
            + Add site
          </button>
        </div>

        {loading ? (
          Array.from({length:4}).map((_,i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : sites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-3">No sites configured yet</p>
            <button onClick={openCreate} className="btn-primary text-sm">Add first site</button>
          </div>
        ) : (
          sites.map(site => (
            <div key={site.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#0C447C" strokeWidth="1.5">
                    <path d="M10 2C6.686 2 4 4.686 4 8c0 5.25 6 10 6 10s6-4.75 6-10c0-3.314-2.686-6-6-6z"/>
                    <circle cx="10" cy="8" r="2"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{site.name}</p>
                    <span className={`badge ${REGION_COLORS[site.region] || 'badge-gray'} text-[10px]`}>
                      {site.region}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{site.location}</p>
                  <p className="text-[10px] font-mono text-gray-300 mt-1">ID: {site.id}</p>
                </div>
                <button
                  onClick={() => openEdit(site)}
                  className="text-xs text-navy-700 font-medium px-3 py-1.5 rounded-lg bg-blue-50 flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
        
        {/* Info note */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">About sites</p>
          Sites represent workshop locations within the Faculty of Engineering.
          Deleting a site is not supported — decommission assets individually and reassign users instead.
        </div>
      </div> {/* closes scroll-area */}

      {showModal && (
        <SiteModal
          site={editing}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div> /* closes flex-col */
  )
}

function SiteModal({ site, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: site || { name: '', location: '', region: 'Central' },
  })

  const onSubmit = async (data) => {
    setSaving(true)
    await onSave(data)
    setSaving(false)
  }

  return (
     <Modal
      title={site ? 'Edit site' : 'Add new site'}
      onClose={onClose}
      footer={
        <button type="submit" form="site-form" disabled={saving} className="btn-primary w-full disabled:opacity-60">
          {saving ? 'Saving…' : site ? 'Save changes' : 'Add site'}
        </button>
      }
    >
      <form id="site-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="field">
          <label>Site name *</label>
          <input placeholder="e.g. Machine Shop"
            {...register('name', { required: 'Required' })} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        <div className="field">
          <label>Location *</label>
          <input placeholder="e.g. Faculty Of Engineering"
            {...register('location', { required: 'Required' })} />
          {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
        </div>

        <div className="field">
          <label>Region *</label>
          <select {...register('region', { required: true })}>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {!site && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            The site ID is auto-generated from the name (lowercase, hyphenated). It cannot be changed after creation.
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full mt-2 disabled:opacity-60">
          {saving ? 'Saving…' : site ? 'Save changes' : 'Add site'}
        </button>
      </form>
    </Modal>
  )
}
