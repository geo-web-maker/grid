// scripts/seed.js
// Run with: node scripts/seed.js
// Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key JSON
// Or run from Firebase emulator: firebase emulators:exec "node scripts/seed.js"

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(
  readFileSync(new URL('../serviceAccountKey.json', import.meta.url))
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── Sites ────────────────────────────────────────────────────────────────────
const SITES = [
  { id: 'nalubaale', name: 'Nalubaale Power Station', location: 'Jinja',   region: 'Eastern' },
  { id: 'kiira',     name: 'Kiira Power Station',      location: 'Jinja',   region: 'Eastern' },
  { id: 'isimba',    name: 'Isimba HPP',               location: 'Kayunga', region: 'Central' },
  { id: 'karuma',    name: 'Karuma HPP',                location: 'Kiryandongo', region: 'Northern' },
]

// ── Assets ───────────────────────────────────────────────────────────────────
const ASSETS = [
  {
    id: 'trb-012-nlb-22', asset_code: 'TRB-012-NLB-22', name: 'Turbine Unit 12',
    category: 'turbine', site_id: 'nalubaale', status: 'operational',
    pm_interval_days: 30, installed_at: Timestamp.fromDate(new Date('2022-03-15')),
    next_pm_due: Timestamp.fromDate(new Date('2026-05-05')),
  },
  {
    id: 'gen-045-kla-24', asset_code: 'GEN-045-KLA-24', name: 'Generator 45',
    category: 'generator', site_id: 'kiira', status: 'maintenance',
    pm_interval_days: 45, installed_at: Timestamp.fromDate(new Date('2024-01-10')),
    next_pm_due: Timestamp.fromDate(new Date('2026-04-30')),
  },
  {
    id: 'pmp-008-ism-23', asset_code: 'PMP-008-ISM-23', name: 'Cooling Pump 8',
    category: 'pump', site_id: 'isimba', status: 'operational',
    pm_interval_days: 60, installed_at: Timestamp.fromDate(new Date('2023-07-20')),
    next_pm_due: Timestamp.fromDate(new Date('2026-05-20')),
  },
  {
    id: 'cmp-003-kru-24', asset_code: 'CMP-003-KRU-24', name: 'Compressor 3',
    category: 'compressor', site_id: 'karuma', status: 'overdue',
    pm_interval_days: 30, installed_at: Timestamp.fromDate(new Date('2024-02-01')),
    next_pm_due: Timestamp.fromDate(new Date('2026-04-10')),
  },
  {
    id: 'clg-002-kru-24', asset_code: 'CLG-002-KRU-24', name: 'Cooling System 2',
    category: 'cooling', site_id: 'karuma', status: 'operational',
    pm_interval_days: 90, installed_at: Timestamp.fromDate(new Date('2024-03-12')),
    next_pm_due: Timestamp.fromDate(new Date('2026-06-01')),
  },
]

// ── Reminders ────────────────────────────────────────────────────────────────
const REMINDERS = [
  {
    asset_id: 'TRB-012-NLB-22', type: 'Turbine bearing check',
    status: 'overdue', due_date: Timestamp.fromDate(new Date('2026-04-30')),
    due_label: 'Overdue by 2 days', overdue_days: 2, notified: true,
  },
  {
    asset_id: 'GEN-007-KLA-22', type: 'Generator oil change',
    status: 'soon', due_date: Timestamp.fromDate(new Date('2026-05-05')),
    due_label: 'Due in 3 days', overdue_days: 0, notified: false,
  },
  {
    asset_id: 'PMP-015-ISM-23', type: 'Pump seal replacement',
    status: 'upcoming', due_date: Timestamp.fromDate(new Date('2026-05-14')),
    due_label: 'Due in 12 days', overdue_days: 0, notified: false,
  },
  {
    asset_id: 'CLG-002-KRU-24', type: 'Cooling system flush',
    status: 'scheduled', due_date: Timestamp.fromDate(new Date('2026-05-22')),
    due_label: 'Due in 20 days', overdue_days: 0, notified: false,
  },
]

// ── Parts catalogue ───────────────────────────────────────────────────────────
const PARTS_CATALOGUE = [
  { name: 'Bearing seal 45mm',     part_code: 'BS-45',   category: 'Seals & gaskets',       unit: 'piece', supplier: 'Kampala Engineering Supplies' },
  { name: 'Bearing seal 60mm',     part_code: 'BS-60',   category: 'Seals & gaskets',       unit: 'piece', supplier: 'Kampala Engineering Supplies' },
  { name: 'O-ring pump impeller',  part_code: 'OR-PI',   category: 'Seals & gaskets',       unit: 'piece', supplier: 'Jinja Industrial Parts' },
  { name: 'Ball bearing 6205',     part_code: 'BB-6205', category: 'Bearings',              unit: 'piece', supplier: 'SKF Uganda' },
  { name: 'Ball bearing 6308',     part_code: 'BB-6308', category: 'Bearings',              unit: 'piece', supplier: 'SKF Uganda' },
  { name: 'Turbine oil ISO 46',    part_code: 'TO-46',   category: 'Lubricants & oils',     unit: 'litre', supplier: 'Total Energies Uganda' },
  { name: 'Grease cartridge 400g', part_code: 'GR-400',  category: 'Lubricants & oils',     unit: 'piece', supplier: 'Total Energies Uganda' },
  { name: 'Air filter element',    part_code: 'AF-EL',   category: 'Filters',               unit: 'piece', supplier: 'Kampala Engineering Supplies' },
  { name: 'Oil filter cartridge',  part_code: 'OF-CT',   category: 'Filters',               unit: 'piece', supplier: 'Kampala Engineering Supplies' },
  { name: 'Generator brush set',   part_code: 'GB-SET',  category: 'Brushes & contacts',    unit: 'set',   supplier: 'Siemens Uganda' },
  { name: 'Carbon brush 25x32mm',  part_code: 'CB-25',   category: 'Brushes & contacts',    unit: 'piece', supplier: 'Siemens Uganda' },
  { name: 'Compressor valve kit',  part_code: 'CV-KIT',  category: 'Valves',                unit: 'set',   supplier: 'Jinja Industrial Parts' },
  { name: 'Gate valve 2 inch',     part_code: 'GV-2',    category: 'Valves',                unit: 'piece', supplier: 'Jinja Industrial Parts' },
  { name: 'M12 bolt set (20pc)',   part_code: 'BLT-M12', category: 'Bolts & fasteners',     unit: 'set',   supplier: 'Local hardware' },
  { name: 'Cooling hose 1m',       part_code: 'CH-1M',   category: 'Other',                 unit: 'metre', supplier: 'Kampala Engineering Supplies' },
]
  const batch = db.batch()

  // Sites
  for (const site of SITES) {
    batch.set(db.collection('sites').doc(site.id), site)
  }

  // Assets
  for (const asset of ASSETS) {
    batch.set(db.collection('assets').doc(asset.id), {
      ...asset,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
  }

  // Reminders
  for (const r of REMINDERS) {
    batch.set(db.collection('reminders').doc(), {
      ...r,
      created_at: Timestamp.now(),
    })
  }

  // Parts catalogue
  for (const part of PARTS_CATALOGUE) {
    batch.set(db.collection('parts_catalogue').doc(), {
      ...part,
      in_stock:   true,
      notes:      '',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
  }

  await batch.commit()
  console.log(
    '✅ Seed complete:',
    SITES.length, 'sites,',
    ASSETS.length, 'assets,',
    REMINDERS.length, 'reminders,',
    PARTS_CATALOGUE.length, 'parts'
  )
  process.exit(0)
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1) })
