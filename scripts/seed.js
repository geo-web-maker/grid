// scripts/seed.js
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

// Load your service account key
const serviceAccount = JSON.parse(
  readFileSync(new URL('../serviceAccountKey.json', import.meta.url))
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seed() {
  const batch = db.batch()

  // ── SITES ──────────────────────────────────────────────────────────────────
  const SITES = [
    {
      id: "machine-shop",
      name: "Machine Shop",
      location: "Faculty of Engineering, Kyambogo University",
      region: "Kampala"
    },
    {
      id: "welding-fabrication",
      name: "Welding and Fabrication",
      location: "Faculty of Engineering, Kyambogo University",
      region: "Kampala"
    }
  ]

  // ── ASSETS ─────────────────────────────────────────────────────────────────
  const ASSETS = [
    {
      id: "asset-001", asset_code: "OTH-101-KYU-26", name: "Milford 14\" Pedestal Grinder",
      category: "other", site_id: "machine-shop", status: "maintenance",
      make: "Milford", pm_interval_days: 90,
      notes: "Belt replaced in last corrective maintenance. Recurring issue: grinding wheel clearing needed."
    },
    {
      id: "asset-002", asset_code: "OTH-102-KYU-26", name: "Shearing Machine (Guillotine)",
      category: "other", site_id: "welding-fabrication", status: "maintenance",
      make: "AQI", model: "10x2500", pm_interval_days: 60,
      notes: "Max shear: width 2500mm, thickness 10mm. Recurring: blade misalignment."
    },
    {
      id: "asset-003", asset_code: "OTH-103-KYU-26", name: "A-C Arc Welder",
      category: "other", site_id: "welding-fabrication", status: "operational",
      make: "SP (Italy Technology)", model: "BX1-315 GTAILE", pm_interval_days: 90,
      notes: "Good working condition. Recurring: damage to cables by students."
    },
    {
      id: "asset-004", asset_code: "OTH-104-KYU-26", name: "CNC Vertical Milling Machine",
      category: "other", site_id: "machine-shop", status: "operational",
      make: "Venepr", model: "BF210/F300", pm_interval_days: 30,
      notes: "Excellent condition. Recurring issues: air pipe breakage."
    },
    {
      id: "asset-005", asset_code: "OTH-105-KYU-26", name: "Conventional Lathe (Vemack Turner 400)",
      category: "other", site_id: "machine-shop", status: "maintenance",
      make: "Vemack", model: "1.10B.11", pm_interval_days: 60,
      notes: "Needs repair. Last work: machining of nut for carriage screw."
    },
    {
      id: "asset-006", asset_code: "OTH-106-KYU-26", name: "Universal Milling Machine",
      category: "other", site_id: "machine-shop", status: "operational",
      make: "Vemack", model: "UF25D", pm_interval_days: 30,
      notes: "Good condition. Last maintenance: Z-axis clutch disengagement."
    },
    {
      id: "asset-007", asset_code: "OTH-107-KYU-26", name: "Horizontal Spindle Surface Grinder",
      category: "other", site_id: "machine-shop", status: "maintenance",
      make: "VENEFIRE (Italy)", model: "M71S x1000/ZD", pm_interval_days: 60,
      notes: "Needs repair. Troubleshooting DC output relay for magnetizing table."
    },
    {
      id: "asset-008", asset_code: "OTH-108-KYU-26", name: "Mascot Lathe",
      category: "other", site_id: "machine-shop", status: "overdue",
      pm_interval_days: 90, notes: "Last corrective maintenance: restoring cross-slide tool carrier."
    },
    {
      id: "asset-009", asset_code: "OTH-109-KYU-26", name: "Gear Hobbing Machine",
      category: "other", site_id: "machine-shop", status: "maintenance",
      make: "Vemack", model: "1.10B 24", pm_interval_days: 60,
      notes: "Needs repair. Last work: replacement of drive gears."
    },
    {
      id: "asset-010", asset_code: "OTH-110-KYU-26", name: "Shaper",
      category: "other", site_id: "machine-shop", status: "operational",
      make: "Vemack", model: "BC6063", pm_interval_days: 60,
      notes: "Good condition. Last maintenance: greasing and oiling."
    }
  ]

  // ── LOGS ───────────────────────────────────────────────────────────────────
  const LOGS = [
    {
      id: "log-001", asset_id: "asset-001", type: "corrective", status: "approved",
      work_performed: "Replacement of the belt", logged_at: "2024-05-05T09:00:00Z"
    },
    {
      id: "log-003", asset_id: "asset-003", type: "corrective", status: "approved",
      work_performed: "Cable and electrode holder replacement", logged_at: "2025-06-01T09:00:00Z"
    }
    // Add more log objects from your JSON as needed
  ]

  // ── PARTS CATALOGUE ────────────────────────────────────────────────────────
  const PARTS = [
    { name: 'Pneumatic Air Hose (8mm)', part_code: 'CNC-PH-08', category: 'Pneumatics', unit: 'metre', supplier: 'Kampala Industrial Equipment' },
    { name: 'CNC Tool Holder BT40', part_code: 'CNC-TH-BT40', category: 'Tooling', unit: 'piece', supplier: 'Vemack Official' },
    { name: 'Lathe Drive Belt (B-Section)', part_code: 'LTH-BELT-B', category: 'Belts', unit: 'piece', supplier: 'Industrial Belts Ltd' },
    { name: "Welding Electrode Holder 300A", part_code: "WLD-EH-300", category: "Welding", unit: "piece", supplier: "Desbro Uganda" },
    { name: "Grinding Wheel (14 inch)", part_code: "GRD-WHL-14", category: "Consumables", unit: "piece", supplier: "Hardware World" },
    { name: "Machine Oil ISO 68", part_code: "LUB-OIL-68", category: "Lubricants", unit: "litre", supplier: "TotalEnergies Uganda" }
  ]

  // ── BATCH EXECUTION ────────────────────────────────────────────────────────
  
  console.log('Starting seed process...')

  SITES.forEach(s => batch.set(db.collection('sites').doc(s.id), s))
  
  ASSETS.forEach(a => {
    batch.set(db.collection('assets').doc(a.id), {
      ...a,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    })
  })

  LOGS.forEach(l => {
    batch.set(db.collection('logs').doc(l.id), {
      ...l,
      logged_at: Timestamp.fromDate(new Date(l.logged_at)),
      submitted_at: Timestamp.now()
    })
  })

  PARTS.forEach(p => {
    const ref = db.collection('parts_catalogue').doc()
    batch.set(ref, {
      ...p,
      in_stock: true,
      current_stock: 10,
      created_at: Timestamp.now()
    })
  })

  await batch.commit()
  console.log('✅ Kyambogo University Environment Seeded!')
  process.exit(0)
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })
