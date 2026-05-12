// src/pages/AssetsPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { fetchAllAssets } from '../lib/firestoreService'
import { fetchCategories } from '../lib/adminService'
import { getLocalAssets } from '../lib/localDb'

const STATUS_BADGE = {
  operational:    'badge-green',
  maintenance:    'badge-amber',
  overdue:        'badge-red',
  decommissioned: 'badge-gray',
}

const STATUS_LABEL = {
  operational:    'Active',
  maintenance:    'Maintenance',
  overdue:        'Overdue PM',
  decommissioned: 'Retired',
}

export default function AssetsPage() {
  const navigate = useNavigate()
  const { assets, setAssets, isOnline } = useAppStore()
  const [search, setSearch]         = useState('')
  const [cat, setCat]               = useState('All')
  const [loading, setLoading]       = useState(!assets.length)
  const [categories, setCategories] = useState(['All'])   // ← from DB

  useEffect(() => {
    const load = async () => {
      if (isOnline) {
        const [data, cats] = await Promise.all([
          fetchAllAssets(),
          fetchCategories(),           // ← fetch from DB
        ])
        setAssets(data)
        setCategories(cats)
      } else {
        const data = await getLocalAssets()
        setAssets(data)
        // derive categories from cached assets when offline
        const cats = ['All', ...new Set(data.map(a => a.category).filter(Boolean))]
        setCategories(cats)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = assets.filter((a) => {
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.site_id?.toLowerCase().includes(search.toLowerCase())
    const matchCat = cat === 'All' || a.category?.toLowerCase().includes(cat.toLowerCase().slice(0,-1))
    return matchSearch && matchCat
  })

  return (
    <div className="scroll-area">
      <input
        type="text"
        placeholder="Search by ID, name, or site..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-800"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors
              ${cat === c ? 'bg-navy-800 text-white border-navy-800' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        Array.from({length: 4}).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No assets found</p>
      ) : (
        filtered.map((asset) => (
          <div
            key={asset.id}
            className="card cursor-pointer active:bg-gray-50 transition-colors"
            onClick={() => navigate(`/assets/${asset.asset_code}`)}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <AssetIcon category={asset.category} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                <p className="text-xs font-mono text-gray-500">{asset.asset_code} · {asset.site_id}</p>
              </div>
              <span className={`badge ${STATUS_BADGE[asset.status] || 'badge-gray'}`}>
                {STATUS_LABEL[asset.status] || asset.status}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-50 text-xs text-gray-400">
              <span>Last logged: {asset.last_logged || 'N/A'}</span>
              <span className="text-navy-700">View →</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AssetIcon({ category }) {
  const c = (category || '').toLowerCase()
  if (c.includes('turbine'))   return <TurbineIcon />
  if (c.includes('generator')) return <GeneratorIcon />
  if (c.includes('pump'))      return <PumpIcon />
  return <DefaultIcon />
}

const TurbineIcon   = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#185FA5" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>
const GeneratorIcon = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#3B6D11" strokeWidth="1.5"><rect x="2" y="5" width="12" height="8" rx="1"/><path d="M5 5V3a3 3 0 016 0v2"/></svg>
const PumpIcon      = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#854F0B" strokeWidth="1.5"><ellipse cx="8" cy="6" rx="5" ry="2"/><path d="M3 6v4c0 1.1 2.2 2 5 2s5-.9 5-2V6"/></svg>
const DefaultIcon   = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.5"><path d="M8 1l7 4v6l-7 4-7-4V5l7-4z"/></svg>
