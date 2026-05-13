// src/pages/SupervisorPage.jsx
import { useEffect, useState } from 'react'
import { fetchPendingApprovals, approveLog } from '../lib/firestoreService'
import { fetchAllAssetsAdmin } from '../lib/adminService'
import useAppStore from '../store/useAppStore'

export default function SupervisorPage() {
  const { user, addToast }          = useAppStore()
  const [approvals, setApprovals]   = useState([])
  const [assets, setAssets]         = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      fetchPendingApprovals(),
      fetchAllAssetsAdmin(),
    ]).then(([a, ass]) => {
      setApprovals(a)
      setAssets(ass)
    }).finally(() => setLoading(false))
  }, [])

  const handleApprove = async (logId) => {
    try {
      await approveLog(logId, user?.uid)
      setApprovals(prev => prev.filter(a => a.id !== logId))
      addToast('Log approved', 'success')
    } catch {
      addToast('Approval failed — check connection', 'error')
    }
  }

  // Real stats from Firestore
  const totalAssets  = assets.length
  const operational  = assets.filter(a => a.status === 'operational').length
  const maintenance  = assets.filter(a => a.status === 'maintenance').length
  const overdue      = assets.filter(a => a.status === 'overdue').length

  // Compliance per site — based on non-overdue assets at each site
  const sites = [...new Set(assets.map(a => a.site_id))].filter(Boolean)
  const siteCompliance = sites.map(siteId => {
    const siteAssets    = assets.filter(a => a.site_id === siteId)
    const siteOverdue   = siteAssets.filter(a => a.status === 'overdue').length
    const pct           = siteAssets.length > 0
      ? Math.round(((siteAssets.length - siteOverdue) / siteAssets.length) * 100)
      : 100
    const colors = ['#1D9E75', '#0C447C', '#EF9F27', '#E24B4A', '#378ADD']
    const idx    = sites.indexOf(siteId)
    return { name: siteId, pct, color: colors[idx % colors.length] }
  })

  return (
    <div className="p-4 flex flex-col gap-4 pb-8">

      {/* Stats — real data */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card">
          <div className="stat-label">Total assets</div>
          <div className="stat-value">{totalAssets}</div>
          <div className="stat-hint text-gray-400">All sites</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending approvals</div>
          <div className="stat-value">{approvals.length}</div>
          <div className="stat-hint text-amber-500">
            {approvals.length === 0 ? 'All caught up' : 'Need review'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Operational</div>
          <div className="stat-value">{operational}</div>
          <div className="stat-hint text-teal-600">Assets active</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue PM</div>
          <div className="stat-value">{overdue}</div>
          <div className="stat-hint text-red-500">
            {overdue === 0 ? 'None overdue' : 'Needs attention'}
          </div>
        </div>
      </div>

      {/* Pending approvals */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Pending approvals</h3>
          {approvals.length > 0 && (
            <span className="badge badge-amber">{approvals.length}</span>
          )}
        </div>
        {loading ? (
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ) : approvals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">All caught up ✓</p>
        ) : (
          approvals.map(log => (
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

      {/* Compliance by site — real data */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Compliance by site</h3>
        {siteCompliance.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            No sites yet — add assets in Admin panel
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {siteCompliance.map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-700 capitalize">{s.name}</span>
                  <span className="font-mono text-gray-600">{s.pct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset status breakdown */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Asset status breakdown</h3>
        {totalAssets === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            No assets registered yet
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {[
              { label: 'Operational', count: operational, color: '#1D9E75' },
              { label: 'Under maintenance', count: maintenance, color: '#EF9F27' },
              { label: 'Overdue PM', count: overdue, color: '#E24B4A' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-700">{s.label}</span>
                  <span className="font-mono text-gray-600">
                    {s.count} / {totalAssets}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${totalAssets > 0 ? (s.count / totalAssets) * 100 : 0}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record retrieval comparison — keep as is, it's a fixed comparison */}
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
