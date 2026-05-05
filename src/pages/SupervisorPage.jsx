// src/pages/SupervisorPage.jsx
import { useEffect, useState } from 'react'
import { fetchPendingApprovals, approveLog } from '../lib/firestoreService'
import useAppStore from '../store/useAppStore'

const SITES = [
  { name: 'Nalubaale', pct: 91, color: '#1D9E75' },
  { name: 'Kiira',     pct: 88, color: '#0C447C' },
  { name: 'Isimba',    pct: 79, color: '#EF9F27' },
  { name: 'Karuma',    pct: 72, color: '#E24B4A' },
]

const TOP_PARTS = [
  { name: 'Bearing seal 45mm', count: 12, tag: 'Turbines', badge: 'badge-blue' },
  { name: 'Generator brush set', count: 8, tag: 'All sites', badge: 'badge-purple' },
  { name: 'Pump impeller O-ring', count: 6, tag: 'Isimba', badge: 'badge-amber' },
]

export default function SupervisorPage() {
  const { user, addToast } = useAppStore()
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetchPendingApprovals()
      .then(setApprovals)
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (logId) => {
    try {
      await approveLog(logId, user?.uid)
      setApprovals((prev) => prev.filter((a) => a.id !== logId))
      addToast('Log approved', 'success')
    } catch {
      addToast('Approval failed — check connection', 'error')
    }
  }

  return (
    <div className="scroll-area">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card"><div className="stat-label">Logs · April</div><div className="stat-value">87</div><div className="stat-hint text-teal-600">+23% vs March</div></div>
        <div className="stat-card"><div className="stat-label">PM compliance</div><div className="stat-value">84%</div><div className="stat-hint text-gray-400">Target: 90%</div></div>
        <div className="stat-card"><div className="stat-label">Avg retrieval</div><div className="stat-value text-lg">4.2s</div><div className="stat-hint text-teal-600">Was 14 min</div></div>
        <div className="stat-card"><div className="stat-label">Missing records</div><div className="stat-value">2</div><div className="stat-hint text-red-500">Was 31</div></div>
      </div>

      {/* Pending approvals */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Pending approvals</h3>
          {approvals.length > 0 && <span className="badge badge-amber">{approvals.length}</span>}
        </div>
        {loading ? (
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ) : approvals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">All caught up ✓</p>
        ) : (
          approvals.map((log) => (
            <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <p className="text-xs font-mono font-medium text-gray-900">{log.asset_id}</p>
                <p className="text-xs text-gray-500">{log.technician_id} · {log.type}</p>
              </div>
              <button
                onClick={() => handleApprove(log.id)}
                className="px-3 py-1.5 bg-teal-700 text-white text-xs font-medium rounded-lg"
              >
                Approve
              </button>
            </div>
          ))
        )}
      </div>

      {/* Compliance by site */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Compliance by site</h3>
        <div className="flex flex-col gap-3.5">
          {SITES.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-700">{s.name}</span>
                <span className="font-mono text-gray-600">{s.pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top spare parts */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Spare parts · top this month</h3>
        {TOP_PARTS.map((p) => (
          <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-800 flex-1">{p.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">×{p.count}</span>
              <span className={`badge ${p.badge}`}>{p.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Retrieval comparison */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Record retrieval time</h3>
        <div className="flex items-center gap-4">
          <div className="text-center flex-1">
            <p className="text-2xl font-mono font-medium text-navy-800">4.2s</p>
            <p className="text-xs text-gray-400 mt-1">Digital (now)</p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="text-center flex-1">
            <p className="text-2xl font-mono font-medium text-gray-300">14m</p>
            <p className="text-xs text-gray-400 mt-1">Paper (before)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
