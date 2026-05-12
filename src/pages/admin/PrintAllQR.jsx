// src/pages/admin/PrintAllQR.jsx
// One-time use: shows QR codes for all seeded assets so you can print them.

import { useEffect, useState } from 'react'
import { fetchAllAssetsAdmin } from '../../lib/adminService'
import { generateQRDataUrl } from '../../lib/qrGenerator'

export default function PrintAllQR() {
  const [assets, setAssets] = useState([])
  const [qrMap,  setQrMap]  = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllAssetsAdmin().then(async (list) => {
      setAssets(list)
      // Generate QR for every asset
      const map = {}
      await Promise.all(
        list.map(async (a) => {
          map[a.id] = await generateQRDataUrl(a.asset_code, 200)
        })
      )
      setQrMap(map)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="p-8 text-center text-sm text-gray-400">Generating QR codes…</div>
  )

  return (
    <div>
      {/* Print button — hidden when printing */}
      <div className="p-4 flex justify-between items-center border-b print:hidden">
        <p className="text-sm font-medium text-gray-900">
          {assets.length} QR tags ready to print
        </p>
        <button
          onClick={() => window.print()}
          className="btn-primary text-sm px-6"
        >
          Print all tags
        </button>
      </div>

      {/* Grid of tags — this is what prints */}
      <div className="grid grid-cols-2 gap-4 p-6 print:grid-cols-3 print:gap-6 print:p-4">
        {assets.map(asset => (
          <div
            key={asset.id}
            className="border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2
              print:border print:border-black print:rounded-none print:break-inside-avoid"
          >
            <img
              src={qrMap[asset.id]}
              alt={asset.asset_code}
              className="w-32 h-32"
            />
            <p className="text-xs font-bold font-mono text-center">{asset.asset_code}</p>
            <p className="text-xs text-center text-gray-700 font-medium leading-tight">
              {asset.name}
            </p>
            <p className="text-[10px] text-gray-400 text-center capitalize">
              {asset.category} · {asset.site_id}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:break-inside-avoid, .print\\:break-inside-avoid * { visibility: visible; }
        }
      `}</style>
    </div>
  )
}
