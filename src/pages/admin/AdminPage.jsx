// src/pages/admin/AdminPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import UsersAdmin    from './UsersAdmin'
import AssetsAdmin   from './AssetsAdmin'
import PartsAdmin    from './PartsAdmin'
import SitesAdmin    from './SitesAdmin'

export default function AdminPage() {
  const navigate    = useNavigate()
  const { userProfile } = useAppStore()
  const [activeTab, setActiveTab] = useState('users')

const ALL_TABS = [
  {
    id: 'users', label: 'Users',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2a4 4 0 100 8 4 4 0 000-8z"/>
        <path d="M3 18s-1-1-1-2 2-5 8-5 8 4 8 5-1 2-1 2H3z"/>
      </svg>
    ),
  },
  {
    id: 'assets', label: 'Assets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="3"/>
        <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.2 3.2l1.4 1.4M15.4 15.4l1.4 1.4M3.2 16.8l1.4-1.4M15.4 4.6l1.4-1.4"/>
      </svg>
    ),
  },
  {
    id: 'parts', label: 'Parts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="16" height="10" rx="1"/>
        <path d="M6 7V5a4 4 0 018 0v2"/>
        <path d="M8 12h4M10 10v4"/>
      </svg>
    ),
  },
  {
    id: 'sites', label: 'Sites',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2C6.686 2 4 4.686 4 8c0 5.25 6 10 6 10s6-4.75 6-10c0-3.314-2.686-6-6-6z"/>
        <circle cx="10" cy="8" r="2"/>
      </svg>
    ),
  },
  {
    id: 'print', label: 'Print QR',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
    ),
  },
]

const TABS = userProfile?.role === 'manager'
  ? ALL_TABS
  : ALL_TABS.filter(t => t.id === 'users')

  // Guard — only managers & managers
  if (!['manager', 'supervisor'].includes(userProfile?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#DC2626" strokeWidth="1.5">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z"/>
            <path d="M10 6v5M10 13v.5"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">Access restricted</p>
        <p className="text-xs text-gray-500">Admin panel is only available to managers.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm mt-2">Go back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-white px-2 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'print') {
                navigate('/admin/print-qr'); // Jump to the full-screen print page
              } else {
                setActiveTab(tab.id); // Switch local views
              }
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-navy-800 border-b-2 border-navy-800'
                : 'text-gray-400 border-b-2 border-transparent'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'users'  && <UsersAdmin />}
        {activeTab === 'assets' && <AssetsAdmin />}
        {activeTab === 'parts'  && <PartsAdmin />}
        {activeTab === 'sites'  && <SitesAdmin />}
      </div>
    </div>
  )
}
