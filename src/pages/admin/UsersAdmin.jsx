// src/pages/admin/UsersAdmin.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { fetchAllUsers, createUser, updateUserProfile, disableUser } from '../../lib/adminService'
import { fetchAllSites } from '../../lib/adminService'
import useAppStore from '../../store/useAppStore'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

const ROLE_BADGE = {
  technician: 'badge-blue',
  supervisor: 'badge-amber',
  manager:    'badge-purple',
}

export default function UsersAdmin() {
  const { addToast }       = useAppStore()
  const [users, setUsers]  = useState([])
  const [sites, setSites]  = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [disabling, setDisabling] = useState(null)
  const [search, setSearch]       = useState('')
  const { userProfile } = useAppStore()

  useEffect(() => {
    Promise.all([fetchAllUsers(), fetchAllSites()])
      .then(([u, s]) => { setUsers(u); setSites(s) })
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit   = (user) => { setEditing(user); setShowModal(true) }

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateUserProfile(editing.id, {
          name:        data.name,
          role:        data.role,
          site_id:     data.site_id,
          employee_id: data.employee_id,
        })
        setUsers(u => u.map(x => x.id === editing.id ? { ...x, ...data } : x))
        addToast('User updated', 'success')
      } else {
        const result = await createUser(data)
        setUsers(u => [...u, { id: result.uid, ...data }])
        addToast('User created — credentials sent by email', 'success')
      }
      setShowModal(false)
    } catch (err) {
      addToast(err.message || 'Failed to save user', 'error')
    }
  }

  const handleDisable = async () => {
    try {
      await disableUser(disabling.id)
      setUsers(u => u.map(x => x.id === disabling.id ? { ...x, disabled: true } : x))
      addToast('User disabled', 'success')
    } catch {
      addToast('Failed to disable user', 'error')
    } finally {
      setDisabling(null)
    }
  }

const filtered = users.filter(u => {
  const matchSearch = !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employee_id?.toLowerCase().includes(search.toLowerCase())

  // Supervisors only see users at their own site
  const matchSite = userProfile?.role === 'manager'
    ? true
    : u.site_id === userProfile?.site_id

  return matchSearch && matchSite
})

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="scroll-area">
        {/* Header */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-800"
          />
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 whitespace-nowrap">
            + Add user
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {['technician', 'supervisor', 'manager'].map(role => {
            const count = users.filter(u => u.role === role).length
            return (
              <div key={role} className="stat-card text-center">
                <div className="stat-value text-lg">{count}</div>
                <div className="stat-label capitalize">{role}s</div>
              </div>
            )
          })}
        </div>

        {/* User list */}
        {loading ? (
          Array.from({length: 4}).map((_,i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No users found</p>
        ) : (
          filtered.map(user => (
            <div key={user.id} className="card flex items-center gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                text-white text-sm font-semibold flex-shrink-0
                ${user.role === 'manager' ? 'bg-purple-500' :
                  user.role === 'supervisor' ? 'bg-amber-500' : 'bg-navy-700'}`}>
                {user.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  {user.disabled && <span className="badge badge-red text-[9px]">Disabled</span>}
                </div>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`badge ${ROLE_BADGE[user.role] || 'badge-gray'} text-[10px]`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] text-gray-400">{user.site_id}</span>
                  {user.employee_id && (
                    <span className="text-[10px] font-mono text-gray-300">{user.employee_id}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => openEdit(user)}
                  className="text-xs text-navy-700 font-medium px-2 py-1 rounded-lg bg-blue-50"
                >
                  Edit
                </button>
                {!user.disabled && (
                  <button
                    onClick={() => setDisabling(user)}
                    className="text-xs text-red-500 font-medium px-2 py-1 rounded-lg bg-red-50"
                  >
                    Disable
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <UserModal
          user={editing}
          sites={sites}
          userProfile={userProfile}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Disable confirm */}
      {disabling && (
        <ConfirmDialog
          message={`Disable ${disabling.name}? They will lose access to the app immediately. You can re-enable them from the Firebase Console.`}
          onConfirm={handleDisable}
          onCancel={() => setDisabling(null)}
        />
      )}
    </div>
  )
}

function UserModal({ user, sites, userProfile, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user || {
      name: '', email: '', password: '', role: 'technician',
      site_id: '', employee_id: '',
    },
  })

  const onSubmit = async (data) => {
    setSaving(true)
    await onSave(data)
    setSaving(false)
  }

  return (
    <Modal title={user ? 'Edit user' : 'Add new user'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-4">
        <div className="field">
          <label>Full name *</label>
          <input placeholder="e.g. Ocen Howard" {...register('name', { required: 'Required' })} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        {!user && (
          <>
            <div className="field">
              <label>Email address *</label>
              <input type="email" placeholder="e.g. o.howard@uegcl.co.ug"
                {...register('email', { required: 'Required' })} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="field">
              <label>Temporary password *</label>
              <input type="password" placeholder="Min. 8 characters"
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              <p className="text-xs text-gray-400 mt-1">User must change this on first login.</p>
            </div>
          </>
        )}

        <div className="field">
          <label>Employee ID</label>
          <input placeholder="e.g. UEGCL-1042" {...register('employee_id')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Role *</label>
            <select {...register('role', { required: true })}>
                {(userProfile?.role === 'manager'
                  ? ['technician', 'supervisor', 'manager']
                  : ['technician']
                ).map(r => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
            </select>
          </div>
          <div className="field">
            <label>Site *</label>
            {userProfile?.role === 'supervisor' ? (
              <input
                value={userProfile.site_id}
                disabled
                className="opacity-60 cursor-not-allowed bg-gray-50"
                {...register('site_id')}
              />
            ) : (
              <select {...register('site_id', { required: 'Required' })}>
                <option value="">Select site</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {errors.site_id && <p className="text-red-500 text-xs">{errors.site_id.message}</p>}
          </div>
        </div>

        {!user && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            A Firebase Auth account will be created. The user receives an email with their credentials and must change their password on first login.
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full mt-2 disabled:opacity-60">
          {saving ? 'Saving…' : user ? 'Save changes' : 'Create user'}
        </button>
      </form>
    </Modal>
  )
}
