// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from './hooks/useAuth'
import { useSyncInit } from './hooks/useSync'
import useAppStore from './store/useAppStore'

import AppShell   from './components/AppShell'
import LoginPage  from './pages/LoginPage'
import HomePage   from './pages/HomePage'
import AssetsPage from './pages/AssetsPage'
import AssetDetailPage from './pages/AssetDetailPage'
import ScanPage   from './pages/ScanPage'
import LogPage    from './pages/LogPage'
import SupervisorPage from './pages/SupervisorPage'
import ProfilePage    from './pages/ProfilePage'
import AdminPage      from './pages/admin/AdminPage'
import ToastContainer from './components/ToastContainer'
import PrintAllQR from './pages/admin/PrintAllQR'

function AuthGuard({ children }) {
  const { user, authReady } = useAppStore()
  if (!authReady) return <SplashScreen />
  if (!user)      return <Navigate to="/login" replace />
  return children
}

function SplashScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6">
          <path d="M2 6V3a1 1 0 011-1h3M14 2h3a1 1 0 011 1v3M18 14v3a1 1 0 01-1 1h-3M6 18H3a1 1 0 01-1-1v-3M6 10h8"/>
        </svg>
      </div>
      <p className="text-white/60 text-sm font-medium">QR Coded Digital Log Book System <br /> Faculty of Engineering <br /> Department of Mechanical</p>
    </div>
  )
}

export default function App() {
  useAuthInit()
  useSyncInit()

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index                    element={<HomePage />} />
          <Route path="assets"            element={<AssetsPage />} />
          <Route path="assets/:assetCode" element={<AssetDetailPage />} />
          <Route path="scan"              element={<ScanPage />} />
          <Route path="log"               element={<LogPage />} />
          <Route path="log/:assetCode"    element={<LogPage />} />
          <Route path="supervisor"        element={<SupervisorPage />} />
          <Route path="profile"           element={<ProfilePage />} />
          <Route path="admin"             element={<AdminPage />} />
          <Route path="admin/print-qr"   element={<PrintAllQR />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
