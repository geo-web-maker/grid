// src/pages/HomePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { fetchRecentLogs, subscribeToReminders } from '../lib/firestoreService'

const STATUS_COLORS = {
  done:      'bg-green-500',
  pending:   'bg-amber-400',
  overdue:   'bg-red-500',
  approved:  'bg-teal-500',
}

const STATUS_BADGES = {
  done:     'badge-green',
  pending:  'badge-amber',
  overdue:  'badge-red',
  approved: 'badge-green',
}

const REMINDER_COLORS = {
  overdue:  '#E24B4A',
  soon:     '#EF9F27',
  upcoming: '#378ADD',
  scheduled:'#1D9E75',
}

const REMINDER_BADGES = {
  overdue:  'badge-red',
  soon:     'badge-amber',
  upcoming: 'badge-blue',
  scheduled:'badge-green',
}

export default function HomePage() {
  const navigate = useNavigate()
  const {
    recentLogs, setRecentLogs,
    reminders, setReminders,
    assets, setAssets,
    queueCount,
  } = useAppStore()

  const [loading, setLoading] = useState(!recentLogs.length)

  useEffect(() => {
    // Fetch assets
    fetchAllAssets().then(setAssets).catch(() => {})

    // Fetch recent logs
    fetchRecentLogs(null, 10).then((logs) => {
      setRecentLogs(logs)
      setLoading(false)
    }).catch(() => setLoading(false))

    // Subscribe to reminders
    const unsub = subscribeToReminders(setReminders)
    return unsub
  }, [])

  const overdueCount = reminders.filter(r => r.status === 'overdue').length

  return (
    <div className="scroll-area">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card">
          <div className="stat-label">Total assets</div>
          <div className="stat-value">{assets.length}</div>
          <div className="stat-hint text-gray-400">All sites</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Logs this month</div>
          <div className="stat-value">{recentLogs.length}</div>
          <div className="stat-hint text-gray-400">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending reminders</div>
          <div className="stat-value">{reminders.length}</div>
          <div className="stat-hint text-red-500">
            {overdueCount > 0 ? `${overdueCount} overdue` : 'All on track'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offline queue</div>
          <div className="stat-value">{queueCount}</div>
          <div className="stat-hint text-gray-400">
            {queueCount === 0 ? 'All synced' : 'Pending sync'}
          </div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#854F0B" strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
            <path d="M8 1l7 13H1L8 1z"/><path d="M8 6v4M8 12v.5"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">{overdueCount} overdue maintenance {overdueCount === 1 ? 'task' : 'tasks'}</p>
            <p className="text-xs text-amber-700 mt-0.5">Immediate attention required</p>
          </div>
        </div>
      )}

      {/* Recent logs */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="ct text-sm font-medium text-gray-900">Recent logs</h3>
          <span className="text-xs text-gray-400">Last 7 days</span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No logs yet</p>
        ) : (
          recentLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: log.status === 'pending' ? '#EF9F27' : log.status === 'overdue' ? '#E24B4A' : '#1D9E75' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-medium text-gray-900 truncate">{log.asset_id}</p>
                <p className="text-xs text-gray-500">{log.type} · {log.technician_id}</p>
              </div>
              <span className={`badge ${STATUS_BADGES[log.status] || 'badge-gray'}`}>
                {log.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Reminders */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Upcoming reminders</h3>
        </div>
        {reminders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">No reminders</p>
        ) : (
          reminders.slice(0, 4).map((r) => (
            <div key={r.id} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: REMINDER_COLORS[r.status] || '#378ADD' }}
              />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">{r.type}</p>
                <p className="text-xs text-gray-500">{r.asset_id} · {r.due_label || 'Due soon'}</p>
              </div>
              <span className={`badge ${REMINDER_BADGES[r.status] || 'badge-blue'}`}>
                {r.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Activity chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Activity this month</h3>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No activity yet — logs will appear here
          </p>
        ) : (
          <div className="flex items-end gap-1.5 h-12">
            {[40, 62, 45, 80, 100, 55, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ height: `${h}%`, background: i === 4 ? '#0C447C' : '#B5D4F4' }}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
