// src/components/AppShell.jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M3 9l7-7 7 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
      </svg>
    ),
  },
  {
    path: '/assets',
    label: 'Assets',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M3 5h14M3 10h14M3 15h14" />
      </svg>
    ),
  },
  {
    path: '/scan',
    label: 'Scan QR',
    isFab: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M2 6V3a1 1 0 011-1h3M14 2h3a1 1 0 011 1v3M18 14v3a1 1 0 01-1 1h-3M6 18H3a1 1 0 01-1-1v-3M6 10h8" />
      </svg>
    ),
  },
  {
    path: '/supervisor',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="11" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="11" width="6" height="6" rx="1" />
        <rect x="11" y="11" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM3 18s-1-1-1-2 2-5 8-5 8 4 8 5-1 2-1 2H3z" />
      </svg>
    ),
  },
]

const TITLES = {
  '/':           ['Dashboard'],
  '/assets':     ['Assets', 'All sites'],
  '/scan':       ['Scan QR', 'Point at asset tag'],
  '/supervisor': ['Supervisor', 'Overview'],
  '/profile':    ['My profile', ''],
  '/admin':      ['Admin panel', 'Manager access only'],
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOnline, lastSyncedAt, isSyncing, userProfile } = useAppStore()

  const path     = location.pathname
  const isDetail = path.startsWith('/assets/') || path.startsWith('/log/')
  const [title, sub] = TITLES[path] || ['', '']

  const syncLabel = isSyncing
    ? 'Syncing…'
    : isOnline
    ? lastSyncedAt
      ? `Synced ${formatRelative(lastSyncedAt)}`
      : 'Online'
    : 'Offline'

  return (
    <div className="flex h-full bg-gray-50">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 bg-navy-900 flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6">
                <path d="M2 6V3a1 1 0 011-1h3M14 2h3a1 1 0 011 1v3M18 14v3a1 1 0 01-1 1h-3M6 18H3a1 1 0 01-1-1v-3M6 10h8"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">QR Logbook</p>
              <p className="text-white/40 text-[10px]">Kyambogo Workshop</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.path === '/'
              ? path === '/'
              : path.startsWith(item.path)

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors text-left w-full
                  ${active
                    ? 'bg-white/15 text-white'
                    : 'text-white/55 hover:bg-white/8 hover:text-white/80'
                  }
                  ${item.isFab ? 'mt-2 bg-teal-700/80 text-white hover:bg-teal-700' : ''}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}

          {/* Admin link — managers only */}
          {userProfile?.role === 'manager' && (
            <button
              onClick={() => navigate('/admin')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors text-left w-full mt-2
                ${path === '/admin'
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/80'
                }`}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <rect x="2" y="2" width="7" height="7" rx="1"/>
                <rect x="11" y="2" width="7" height="7" rx="1"/>
                <rect x="2" y="11" width="7" height="7" rx="1"/>
                <rect x="11" y="11" width="7" height="7" rx="1"/>
              </svg>
              Admin
            </button>
          )}
        </nav>

        {/* Sync status + user */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isOnline ? '#5DCAA5' : '#EF9F27' }}
            />
            <span className="text-[11px] text-white/50 truncate">{syncLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {userProfile?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{userProfile?.name || 'User'}</p>
              <p className="text-white/40 text-[10px] capitalize truncate">{userProfile?.role || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-navy-900 md:bg-white md:border-b md:border-gray-100 px-4 md:px-6
          flex items-center justify-between flex-shrink-0"
          style={{ minHeight: 52 }}
        >
          <div className="flex items-center gap-3">
            {/* Back button for detail pages */}
            {isDetail && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-white/70 md:text-gray-500 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 3L5 8l5 5" />
                </svg>
                <span className="hidden md:inline">Back</span>
              </button>
            )}
            <div>
              <p className="text-white md:text-gray-900 text-base md:text-lg font-semibold leading-tight">
                {title}
              </p>
              {sub && (
                <p className="text-white/55 md:text-gray-400 text-xs">{sub}</p>
              )}
            </div>
          </div>

          {/* Sync pill — mobile only */}
          <div className="flex md:hidden items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isOnline ? '#5DCAA5' : '#EF9F27' }}
            />
            <span className="text-[10px]" style={{ color: isOnline ? '#9FE1CB' : '#FBBF24' }}>
              {syncLabel}
            </span>
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium
              ${isOnline ? 'text-teal-600' : 'text-amber-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-500' : 'bg-amber-400'}`} />
              {syncLabel}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>

        {/* ── Mobile bottom nav ── */}
        <div className="md:hidden flex border-t border-gray-100 bg-white">
          {NAV_ITEMS.map((item) => {
            const active = item.path === '/'
              ? path === '/'
              : path.startsWith(item.path)

            if (item.isFab) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex-[0_0_64px] flex flex-col items-center gap-0.5 pb-3 text-[10px] font-medium text-navy-800"
                >
                  <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center -mt-5 shadow-lg shadow-navy-800/30">
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8">
                      <path d="M2 6V3a1 1 0 011-1h3M14 2h3a1 1 0 011 1v3M18 14v3a1 1 0 01-1 1h-3M6 18H3a1 1 0 01-1-1v-3M6 10h8" />
                    </svg>
                  </div>
                  Scan
                </button>
              )
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-3 text-[10px] transition-colors
                  ${active ? 'text-navy-800' : 'text-gray-400'}`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatRelative(date) {
  const secs = Math.floor((Date.now() - date) / 1000)
  if (secs < 60)  return 'just now'
  if (secs < 120) return '1 min ago'
  return `${Math.floor(secs / 60)} min ago`
}
