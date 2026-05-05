// src/pages/AssetDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchAssetByCode, fetchLogsForAsset } from '../lib/firestoreService'
import { getLocalAssetByCode } from '../lib/localDb'
import useAppStore from '../store/useAppStore'

export default function AssetDetailPage() {
  const { assetCode } = useParams()
  const navigate      = useNavigate()
  const { isOnline }  = useAppStore()
  const [asset, setAsset]   = useState(null)
  const [logs,  setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const a = isOnline
        ? await fetchAssetByCode(assetCode)
        : await getLocalAssetByCode(assetCode)
      setAsset(a)
      if (a) {
        const l = await fetchLogsForAsset(a.id)
        setLogs(l)
      }
      setLoading(false)
    }
    load()
  }, [assetCode])

  if (loading) return <div className="scroll-area"><div className="h-32 bg-gray-100 rounded-2xl animate-pulse" /></div>
  if (!asset)  return <div className="scroll-area"><p className="text-center text-sm text-gray-400 py-8">Asset not found</p></div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="scroll-area">
        {/* Asset header */}
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#0C447C" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-navy-900">{asset.name}</p>
            <p className="text-xs font-mono text-navy-700 mt-0.5">{asset.asset_code}</p>
          </div>
          <span className={`badge ${asset.status === 'operational' ? 'badge-green' : 'badge-amber'}`}>
            {asset.status}
          </span>
        </div>

        {/* Info table */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Asset info</h3>
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Category',    asset.category],
                ['Location',    asset.site_id],
                ['Installed',   asset.installed_at?.toDate?.()?.toLocaleDateString() || 'N/A'],
                ['PM interval', `Every ${asset.pm_interval_days || 30} days`],
                ['Next PM due', asset.next_pm_due?.toDate?.()?.toLocaleDateString() || 'N/A'],
                ['Total logs',  `${logs.length} entries`],
              ].map(([label, val]) => (
                <tr key={label} className="border-t border-gray-50 first:border-0">
                  <td className="text-gray-400 py-1.5 w-2/5">{label}</td>
                  <td className="text-gray-900 font-medium py-1.5">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Maintenance history */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Maintenance history</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No logs yet</p>
          ) : (
            logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: log.status === 'approved' ? '#1D9E75' : '#378ADD' }} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900 capitalize">{log.type} maintenance</p>
                  <p className="text-xs text-gray-500 mt-0.5">{log.technician_id} · {log.duration_hours}h</p>
                  {log.work_performed && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.work_performed}</p>}
                </div>
                <span className={`badge ${log.status === 'approved' ? 'badge-green' : 'badge-blue'}`}>{log.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-2 p-3.5 border-t border-gray-100 bg-white">
        <button className="btn-secondary text-sm" onClick={() => navigate('/scan')}>Scan QR tag</button>
        <button className="btn-primary text-sm"   onClick={() => navigate(`/log/${asset.asset_code}`)}>Log maintenance</button>
      </div>
    </div>
  )
}
