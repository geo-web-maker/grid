// src/components/AppShell.jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Home',
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
  { path: '/scan', label: 'Scan', isFab: true },
  {
    path: '/supervisor',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" />
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
  '/':           ['Dashboard', 'Nalubaale · Kiira sites'],
  '/assets':     ['Assets', 'All sites'],
  '/scan':       ['Scan QR', 'Point at asset tag'],
  '/supervisor': ['Supervisor', 'Overview'],
  '/profile':    ['My profile', ''],
  '/admin':      ['Admin panel', 'Manager access only'],
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isOnline, lastSyncedAt, isSyncing } = useAppStore()

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
    <div className="app-shell">
      {/* Status bar mock */}
      <div className="bg-navy-900 flex justify-between items-center px-4 pt-2.5 pb-2">
        <span className="text-white text-[13px] font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <BatteryIcon />
          <WifiIcon />
          <SignalIcon />
        </div>
      </div>

      {/* Top nav */}
      <div className="bg-navy-900 px-4 pb-3.5 flex items-center justify-between">
        <div>
          {isDetail && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-white/70 text-sm mb-0.5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 3L5 8l5 5" />
              </svg>
              Back
            </button>
          )}
          <p className="text-white text-[17px] font-medium leading-tight">{title}</p>
          {sub && <p className="text-white/55 text-[11px] mt-0.5">{sub}</p>}
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isOnline ? '#5DCAA5' : '#EF9F27' }}
          />
          <span className="text-[10px]" style={{ color: isOnline ? '#9FE1CB' : '#FBBF24' }}>
            {syncLabel}
          </span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <div className="bn bottom-nav-safe bg-white border-t border-gray-100">
        <div className="flex">
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

function SignalIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
      <rect x="0" y="5" width="3" height="6" rx="0.5" fill="rgba(255,255,255,0.4)"/>
      <rect x="4" y="3" width="3" height="8" rx="0.5" fill="rgba(255,255,255,0.65)"/>
      <rect x="8" y="1" width="3" height="10" rx="0.5" fill="rgba(255,255,255,0.85)"/>
      <rect x="12" y="0" width="3" height="11" rx="0.5" fill="white"/>
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
      <path d="M7 2.5C9.5 2.5 11.7 3.5 13.2 5.2L14 4.3C12.2 2.3 9.7 1 7 1S1.8 2.3 0 4.3l.8.9C2.3 3.5 4.5 2.5 7 2.5z" fill="rgba(255,255,255,0.55)"/>
      <path d="M7 5C8.7 5 10.2 5.7 11.3 6.8l.8-.9C10.7 4.7 8.9 4 7 4S3.3 4.7 1.9 5.9l.8.9C3.8 5.7 5.3 5 7 5z" fill="rgba(255,255,255,0.8)"/>
      <circle cx="7" cy="9" r="1.5" fill="white"/>
    </svg>
  )
}

function BatteryIcon() {
  return (
    <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
      <rect x="0" y="1" width="21" height="9" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
      <rect x="1.5" y="2.5" width="15" height="6" rx="1" fill="#5DCAA5"/>
      <rect x="22" y="3.5" width="2" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
    </svg>
  )
}
