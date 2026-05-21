// src/pages/AssetDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchAssetByCode, fetchLogsForAsset, fetchPartsForAsset } from '../lib/firestoreService'
import { getLocalAssetByCode } from '../lib/localDb'
import useAppStore from '../store/useAppStore'
import { CAN_WRITE_ROLES } from '../lib/adminService'
import ScheduleModal from '../components/ScheduleModal'

//debugging
import { getAuth } from 'firebase/auth'

export default function AssetDetailPage() {
  const { assetCode } = useParams()
  const navigate      = useNavigate()
  const { isOnline, addToast, userProfile } = useAppStore()

  //debugging
  console.log('Auth UID:', getAuth().currentUser?.uid)  // ← add this line
  console.log('UserProfile:', userProfile)               // ← and this one

  const canSchedule = CAN_WRITE_ROLES.includes(userProfile?.role)
  const [asset, setAsset]   = useState(null)
  const [logs,  setLogs]    = useState([])
  const [parts, setParts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    const load = async () => {
      const a = isOnline
        ? await fetchAssetByCode(assetCode)
        : await getLocalAssetByCode(assetCode)
      setAsset(a)
      if (a) {
        const [l, p] = await Promise.all([
          fetchLogsForAsset(a.asset_code),
          fetchPartsForAsset(a.asset_code),
        ])
        setLogs(l)
        setParts(p)
      }
      setLoading(false)
    }
    load()
  }, [assetCode])

  const handlePrintReport = () => {
    try {
      const report = {
        asset,
        logs,
        parts,
        generated_at: new Date().toISOString(),
      }
      const win = window.open('', '_blank')
      if (!win) {
        addToast('Allow popups to print reports', 'warning')
        return
      }
      win.document.write(buildReportHTML(report))
      win.document.close()
      win.print()
    } catch (err) {
      addToast('Failed to generate report', 'error')
    }
  }

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
                ['Category',      asset.category],
                ['Make / Brand',  asset.make          || '—'],
                ['Model',         asset.model         || '—'],
                ['Serial No.',    asset.serial_number || '—'],
                ['Year acquired', asset.year_acquired || '—'],
                ['Location',      asset.site_id],
                ['PM interval',   `Every ${asset.pm_interval_days || 30} days`],
                ['Next PM due',   asset.next_pm_due?.toDate?.()?.toLocaleDateString() || 'N/A'],
                ['Total logs',    `${logs.length} entries`],
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
      <div className={`grid gap-2 p-3.5 border-t border-gray-100 bg-white flex-shrink-0 ${canSchedule ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {!canSchedule && (
          <button className="btn-secondary text-sm" onClick={() => navigate('/scan')}>Scan QR</button>
        )}
        <button className="btn-secondary text-sm" onClick={handlePrintReport}>Print report</button>
        {canSchedule && (
          <button className="btn-secondary text-sm" onClick={() => setShowSchedule(true)}>Schedule</button>
        )}
        <button className="btn-primary text-sm" onClick={() => navigate(`/log/${asset.asset_code}`)}>Log maintenance</button>
      </div>

      {showSchedule && (
        <ScheduleModal
          asset={asset}
          onClose={() => setShowSchedule(false)}
          onScheduled={() => {
            setShowSchedule(false)
            addToast('Task scheduled', 'success')
          }}
        />
      )}
    </div>
  )
}

function buildReportHTML(report) {
  const { asset, logs, parts, generated_at } = report
  return `
    <html>
    <head>
      <title>Asset Report — ${asset.asset_code}</title>
      <style>
        body { font-family: sans-serif; padding: 32px; color: #111; font-size: 13px; }
        h1   { font-size: 20px; margin-bottom: 4px; }
        h2   { font-size: 13px; font-weight: 600; margin-top: 28px; margin-bottom: 8px;
               color: #555; text-transform: uppercase; letter-spacing: 0.04em; }
        .meta { color: #888; font-size: 11px; margin-bottom: 28px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 6px 10px; background: #f3f4f6;
             font-weight: 600; color: #374151; }
        td { padding: 6px 10px; border-top: 1px solid #e5e7eb; color: #111; }
        tr:last-child td { border-bottom: 1px solid #e5e7eb; }
        .badge { display: inline-block; padding: 1px 8px; border-radius: 20px;
                 font-size: 10px; font-weight: 500; background: #e5e7eb; color: #374151; }
        .badge-green  { background: #d1fae5; color: #065f46; }
        .badge-amber  { background: #fef3c7; color: #92400e; }
        .badge-red    { background: #fee2e2; color: #991b1b; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${asset.name}</h1>
      <p class="meta">
        Code: ${asset.asset_code} &nbsp;·&nbsp;
        Site: ${asset.site_id} &nbsp;·&nbsp;
        Generated: ${new Date(generated_at).toLocaleString('en-UG')}
      </p>

      <h2>Asset details</h2>
      <table>
        <tbody>
          <tr><th>Status</th><td>${asset.status}</td><th>Category</th><td>${asset.category}</td></tr>
          <tr><th>Make / Brand</th><td>${asset.make || '—'}</td><th>Model</th><td>${asset.model || '—'}</td></tr>
          <tr><th>Serial No.</th><td>${asset.serial_number || '—'}</td><th>Year acquired</th><td>${asset.year_acquired || '—'}</td></tr>
          <tr><th>PM interval</th><td>${asset.pm_interval_days} days</td><th>Location</th><td>${asset.site_id}</td></tr>
          <tr><th>Notes</th><td colspan="3">${asset.notes || '—'}</td></tr>
        </tbody>
      </table>

      <h2>Maintenance history (last 20)</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Type</th><th>Technician</th>
            <th>Duration</th><th>Status</th><th>Work performed</th>
          </tr>
        </thead>
        <tbody>
          ${logs.length === 0
            ? '<tr><td colspan="6" style="color:#9ca3af;text-align:center;padding:16px">No logs recorded</td></tr>'
            : logs.map(l => `
              <tr>
                <td>${l.logged_at ? new Date(l.logged_at).toLocaleDateString('en-UG') : '—'}</td>
                <td>${l.type || '—'}</td>
                <td>${l.technician_id || '—'}</td>
                <td>${l.duration_hours ? l.duration_hours + 'h' : '—'}</td>
                <td><span class="badge ${l.status === 'approved' ? 'badge-green' : 'badge-amber'}">${l.status || '—'}</span></td>
                <td>${l.work_performed || '—'}</td>
              </tr>`).join('')
          }
        </tbody>
      </table>

      <h2>Parts used</h2>
      <table>
        <thead>
          <tr><th>Part name</th><th>Part code</th><th>Qty</th><th>Date used</th></tr>
        </thead>
        <tbody>
          ${parts.length === 0
            ? '<tr><td colspan="4" style="color:#9ca3af;text-align:center;padding:16px">No parts recorded</td></tr>'
            : parts.map(p => `
              <tr>
                <td>${p.part_name || p.name || '—'}</td>
                <td>${p.part_code || '—'}</td>
                <td>${p.quantity_used || '—'}</td>
                <td>${p.used_at ? new Date(p.used_at).toLocaleDateString('en-UG') : '—'}</td>
              </tr>`).join('')
          }
        </tbody>
      </table>
    </body>
    </html>
  `
}
