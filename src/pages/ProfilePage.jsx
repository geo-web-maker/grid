// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { logout } from '../hooks/useAuth'
import { getPendingQueue } from '../lib/localDb'
import { runFullSync } from '../lib/syncEngine'
import { fetchRecentLogs } from '../lib/firestoreService'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, userProfile, isOnline, lastSyncedAt, addToast, setSyncing } = useAppStore()
  const [syncing, setSyncingLocal] = useState(false)
  const [queueCount, setQueueCount] = useState(0)
  const [myLogs, setMyLogs] = useState([])

  useEffect(() => {
    if (user?.uid) {
      fetchRecentLogs(user.uid, 100)
        .then(setMyLogs)
        .catch(() => {})
    }
  }, [user])
  
  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleManualSync = async () => {
    if (!isOnline) { addToast('No connection — cannot sync now', 'warning'); return }
    setSyncingLocal(true)
    setSyncing(true)
    const result = await runFullSync()
    setSyncingLocal(false)
    setSyncing(false)
    const q = await getPendingQueue()
    setQueueCount(q.length)
    addToast(
      result.synced > 0 ? `Synced ${result.synced} record(s)` : 'Nothing new to sync',
      'success'
    )
  }

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  const settings = [
    { label: 'Offline mode',       value: 'Enabled',  color: 'text-teal-600' },
    { label: 'Push notifications', value: 'On',       color: 'text-teal-600' },
    { label: 'Auto-sync',          value: 'On',       color: 'text-teal-600' },
    { label: 'Photo quality',      value: 'Medium',   color: 'text-gray-400' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Profile header */}
      <div className="bg-navy-900 px-6 pt-2 pb-6 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg font-semibold">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-white text-base font-semibold">{userProfile?.name || user?.email || 'User'}</p>
          <p className="text-white/55 text-xs mt-0.5">
            {userProfile?.role || 'Field Technician'} · {userProfile?.site_id || 'Nalubaale'}
          </p>
        </div>
        <span className="badge bg-teal-500/20 text-teal-300 text-xs">Active</span>
      </div>

      <div className="scroll-area">
        {/* Stats */}
        <div className="stat-card">
          <div className="stat-label">My logs</div>
          <div className="stat-value">{myLogs.length}</div>
          <div className="stat-hint text-gray-400">Total submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Role</div>
          <div className="stat-value text-lg capitalize">{userProfile?.role || '—'}</div>
          <div className="stat-hint text-gray-400">{userProfile?.site_id || ''}</div>
        </div>

        {/* Account details */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Account details</h3>
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Employee ID', userProfile?.employee_id || 'UEGCL-1042'],
                ['Role',        userProfile?.role        || 'Field Technician'],
                ['Site',        userProfile?.site_id     || 'Nalubaale'],
                ['Email',       user?.email              || '—'],
                ['Joined',      userProfile?.created_at
                  ? new Date(userProfile.created_at?.toDate?.() || userProfile.created_at).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' })
                  : 'Jan 2023'],
              ].map(([label, val]) => (
                <tr key={label} className="border-t border-gray-50 first:border-0">
                  <td className="text-gray-400 py-2 w-2/5">{label}</td>
                  <td className="text-gray-900 font-medium py-2 break-all">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sync status */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Sync status</h3>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? 'text-teal-600' : 'text-amber-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-500' : 'bg-amber-400'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Last synced</span>
              <span className="text-gray-700 font-medium">
                {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Queued (offline)</span>
              <span className="text-gray-700 font-medium">{queueCount} records</span>
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing || !isOnline}
            className="w-full mt-3 btn-secondary text-sm disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>

        {/* Admin panel — managers only */}
        {userProfile?.role === 'manager' && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl
              bg-navy-800 text-white text-sm font-medium"
          >
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5">
                <rect x="2" y="2" width="7" height="7" rx="1"/>
                <rect x="11" y="2" width="7" height="7" rx="1"/>
                <rect x="2" y="11" width="7" height="7" rx="1"/>
                <rect x="11" y="11" width="7" height="7" rx="1"/>
              </svg>
              Admin panel
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M4 7h6M7 4l3 3-3 3"/>
            </svg>
          </button>
        )}

        {/* App settings */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-1">App settings</h3>
          {settings.map((s, i) => (
            <div
              key={s.label}
              className="flex justify-between items-center py-2.5 border-t border-gray-50 first:border-0 text-sm"
            >
              <span className="text-gray-700">{s.label}</span>
              <span className={`text-xs font-medium ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Offline storage */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Offline storage</h3>
          <p className="text-xs text-gray-400 mb-1.5">Local cache used</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '34%', background: '#0C447C' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] font-mono">
            <span className="text-navy-800">3.4 MB used</span>
            <span className="text-gray-400">10 MB limit</span>
          </div>
        </div>

        {/* App version */}
        <p className="text-center text-xs text-gray-300 font-mono">UEGCL QR Logbook v1.0.0</p>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full btn-danger mb-4"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
