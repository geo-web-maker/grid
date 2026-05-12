// src/pages/ScanPage.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { fetchAssetByCode } from '../lib/firestoreService'
import { getLocalAssetByCode } from '../lib/localDb'
import useAppStore from '../store/useAppStore'

export default function ScanPage() {
  const navigate     = useNavigate()
  const { isOnline } = useAppStore()
  const scannerRef   = useRef(null)
  const qrRef        = useRef(null)

  const [scanned, setScanned]   = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError]       = useState('')
  const [isManual, setIsManual] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const startScanner = async () => {
    if (scannerRef.current) return
    setError('')
    setScanning(true)

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        async (decodedText) => {
          await scanner.stop()
          scannerRef.current = null
          setScanning(false)
          await resolveAsset(decodedText.trim())
        },
        () => {} // ignore intermediate errors
      )
    } catch (err) {
      setScanning(false)
      setError('Camera access denied. Please allow camera access and try again.')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setScanning(false)
  }

  const resolveAsset = async (code) => {
    const asset = isOnline
      ? await fetchAssetByCode(code)
      : await getLocalAssetByCode(code)

    if (!asset) {
      setError(`Asset "${code}" not found. Check the QR tag or try manual entry.`)
      return
    }
    setScanned(asset)
  }

  useEffect(() => () => { stopScanner() }, [])

  return (
    <div className="flex flex-col h-full bg-[#042C53]">
      {/* Camera area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <div className="text-center">
          <p className="text-white text-base font-medium">Scan asset QR tag</p>
          <p className="text-white/55 text-xs mt-1">Point camera at the tag on the equipment</p>
        </div>

        {/* QR frame */}
        <div className="relative w-52 h-52 rounded-xl overflow-hidden bg-white/5">
          <div id="qr-reader" className="w-full h-full" />

          {/* Corner brackets */}
          {['top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
            'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
            'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
            'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-5 h-5 border-[#5DCAA5] ${cls}`} />
          ))}

          {/* Animated scan line */}
          {scanning && (
            <div
              className="absolute left-[10%] right-[10%] h-px bg-teal-400 opacity-80"
              style={{ animation: 'scanLine 2s ease-in-out infinite' }}
            />
          )}

          {/* Idle state icon */}
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 60 60" fill="none">
                <rect x="5" y="5" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
                <rect x="9" y="9" width="10" height="10" fill="rgba(255,255,255,0.18)" rx="1"/>
                <rect x="37" y="5" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
                <rect x="41" y="9" width="10" height="10" fill="rgba(255,255,255,0.18)" rx="1"/>
                <rect x="5" y="37" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
                <rect x="9" y="41" width="10" height="10" fill="rgba(255,255,255,0.18)" rx="1"/>
                <rect x="37" y="37" width="5" height="5" fill="rgba(255,255,255,0.18)" rx="1"/>
                <rect x="44" y="37" width="5" height="5" fill="rgba(255,255,255,0.18)" rx="1"/>
              </svg>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          {!scanning ? (
            <button onClick={startScanner} className="w-full btn-primary bg-white/15 border-0 text-white hover:bg-white/20">
              Start camera
            </button>
          ) : (
            <button onClick={stopScanner} className="w-full btn-secondary bg-white/10 border-white/20 text-white">
              Stop scanning
            </button>
          )}
          {isManual ? (
              <div className="flex flex-col w-full gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Enter Asset ID..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                        resolveAsset(manualCode.trim().toUpperCase());
                        setIsManual(false); // Close input on search
                    }}
                    className="flex-1 py-2.5 bg-[#5DCAA5] text-[#042C53] rounded-xl font-bold text-sm"
                  >
                    Find Asset
                  </button>
                  <button 
                    onClick={() => setIsManual(false)}
                    className="px-4 py-2 text-white/50 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  if (scanning) stopScanner(); // Stop camera if manual is clicked
                  setIsManual(true);
                }}
                className="text-white/50 text-xs hover:text-white transition-colors"
              >
                Enter asset ID manually
              </button>
            )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-400/30 rounded-xl px-4 py-3 text-sm text-red-300 text-center max-w-xs">
            {error}
          </div>
        )}
      </div>

      {/* Scan result */}
      {scanned && (
        <div className="bg-teal-50 border-t border-teal-200 m-3.5 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#185FA5" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-teal-900">{scanned.name}</p>
              <p className="text-xs font-mono text-teal-700">{scanned.asset_code} · {scanned.site_id}</p>
            </div>
            <span className="badge badge-green">Active</span>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 btn-primary text-sm py-2.5"
              onClick={() => navigate(`/log/${scanned.asset_code}`)}
            >
              Log maintenance
            </button>
            <button
              className="flex-1 btn-secondary text-sm py-2.5"
              onClick={() => navigate(`/assets/${scanned.asset_code}`)}
            >
              View detail
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 20%; }
          50%       { top: 78%; }
        }
      `}</style>
    </div>
  )
}
