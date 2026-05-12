// src/pages/admin/AdminPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase' // Make sure this path is correct
import useAppStore from '../../store/useAppStore'
import UsersAdmin    from './UsersAdmin'
import AssetsAdmin   from './AssetsAdmin'
import PartsAdmin    from './PartsAdmin'
import SitesAdmin    from './SitesAdmin'

export default function AdminPage() {
  const navigate = useNavigate()
  const { userProfile } = useAppStore()
  const [activeTab, setActiveTab] = useState('users')
  const [isSeeding, setIsSeeding] = useState(false)

  // ── Seed Logic ─────────────────────────────────────────────────────────────
const handleResetDatabase = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Safety check to prevent the 'undefined' error
    if (!apiUrl || apiUrl === 'undefined') {
      alert("❌ Configuration Error: VITE_API_URL is not set in environment variables.");
      return;
    }

    const confirmFirst = window.confirm("Are you sure? This will restore Kyambogo University base assets and parts.");
    if (!confirmFirst) return;

    const confirmSecond = window.prompt("Type 'RESET' to confirm:");
    if (confirmSecond !== 'RESET') return;

    setIsSeeding(true);
    try {
      const token = await auth.currentUser.getIdToken();
      // Using the apiUrl variable we checked above
      const response = await fetch(`${apiUrl}/admin/seed-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert("✅ Database Seeded Successfully!");
        window.location.reload(); 
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        alert("❌ Error: " + errorData.error);
      }
    } catch (err) {
      console.error("Seed Error:", err);
      alert("❌ Failed to connect to server. Ensure backend is running.");
    } finally {
      setIsSeeding(false);
    }
  };

  const ALL_TABS = [
    { id: 'users', label: 'Users', icon: ( <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2a4 4 0 100 8 4 4 0 000-8z"/><path d="M3 18s-1-1-1-2 2-5 8-5 8 4 8 5-1 2-1 2H3z"/></svg> ) },
    { id: 'assets', label: 'Assets', icon: ( <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="3"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.2 3.2l1.4 1.4M15.4 15.4l1.4 1.4M3.2 16.8l1.4-1.4M15.4 4.6l1.4-1.4"/></svg> ) },
    { id: 'parts', label: 'Parts', icon: ( <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="16" height="10" rx="1"/><path d="M6 7V5a4 4 0 018 0v2"/><path d="M8 12h4M10 10v4"/></svg> ) },
    { id: 'sites', label: 'Sites', icon: ( <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2C6.686 2 4 4.686 4 8c0 5.25 6 10 6 10s6-4.75 6-10c0-3.314-2.686-6-6-6z"/><circle cx="10" cy="8" r="2"/></svg> ) },
    { id: 'print', label: 'Print QR', icon: ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path d="M6 14h12v8H6z" /></svg> ) },
    // NEW SYSTEM TAB
    { id: 'system', label: 'System', icon: ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> ) },
  ]

  const TABS = userProfile?.role === 'manager'
    ? ALL_TABS
    : ALL_TABS.filter(t => t.id === 'users')

  if (!['manager', 'supervisor'].includes(userProfile?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <p className="text-sm font-medium text-gray-900">Access restricted</p>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm mt-2">Go back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-white px-2 gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'print' ? navigate('/admin/print-qr') : setActiveTab(tab.id)}
            className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors
              ${activeTab === tab.id ? 'text-navy-800 border-b-2 border-navy-800' : 'text-gray-400 border-b-2 border-transparent'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'users'  && <UsersAdmin />}
        {activeTab === 'assets' && <AssetsAdmin />}
        {activeTab === 'parts'  && <PartsAdmin />}
        {activeTab === 'sites'  && <SitesAdmin />}
        
        {/* NEW SYSTEM VIEW */}
        {activeTab === 'system' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Database Management</h2>
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-red-800 mb-1">Restore Default Environment</h3>
              <p className="text-xs text-red-600 mb-4">
                This will reset the system with Kyambogo University Machine Shop assets, parts, and sites.
              </p>
              <button 
                onClick={handleResetDatabase}
                disabled={isSeeding}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-red-200 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSeeding ? "Seeding..." : "Reset to Kyambogo Data"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
