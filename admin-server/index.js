process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message)
  console.error(err.stack)
  process.exit(1)
})

require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const admin    = require('firebase-admin')

// Parse service account
let serviceAccount
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} catch (err) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message)
  process.exit(1)
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  console.log('Firebase Admin initialized successfully')
} catch (err) {
  console.error('Firebase Admin init failed:', err.message)
  process.exit(1)
}

const db  = admin.firestore()
const auth = admin.auth()
const app = express()

app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.ALLOWED_ORIGIN,
  ],
}))

// ── Middleware: verify Firebase ID token ─────────────────────────────────────
async function verifyToken(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const token       = header.split('Bearer ')[1]
    const decoded     = await auth.verifyIdToken(token)
    req.uid           = decoded.uid
    const callerDoc   = await db.collection('users').doc(decoded.uid).get()
    req.callerProfile = callerDoc.data()
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ── GET /health ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

// ── POST /create-user ────────────────────────────────────────────────────────
app.post('/create-user', verifyToken, async (req, res) => {
  const caller = req.callerProfile

  if (!['manager', 'supervisor'].includes(caller?.role)) {
    return res.status(403).json({ error: 'Permission denied' })
  }

  const { name, email, password, role, site_id, employee_id } = req.body

  if (caller.role === 'supervisor') {
    if (role !== 'technician') {
      return res.status(403).json({ error: 'Supervisors can only create technicians' })
    }
    if (site_id !== caller.site_id) {
      return res.status(403).json({ error: 'Supervisors can only add users to their own site' })
    }
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    })

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      site_id,
      employee_id:  employee_id || null,
      disabled:     false,
      created_at:   admin.firestore.FieldValue.serverTimestamp(),
      created_by:   req.uid,
    })

    res.json({ uid: userRecord.uid })
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already in use' })
    }
    res.status(500).json({ error: err.message })
  }
})

// ── POST /disable-user ───────────────────────────────────────────────────────
app.post('/disable-user', verifyToken, async (req, res) => {
  const caller = req.callerProfile
  const { uid } = req.body

  if (!['manager', 'supervisor'].includes(caller?.role)) {
    return res.status(403).json({ error: 'Permission denied' })
  }

  if (uid === req.uid) {
    return res.status(400).json({ error: 'Cannot disable your own account' })
  }

  try {
    const targetDoc = await db.collection('users').doc(uid).get()
    const target    = targetDoc.data()

    if (caller.role === 'supervisor') {
      if (target?.role !== 'technician') {
        return res.status(403).json({ error: 'Supervisors can only disable technicians' })
      }
      if (target?.site_id !== caller.site_id) {
        return res.status(403).json({ error: 'Cannot disable users from another site' })
      }
    }

    await auth.updateUser(uid, { disabled: true })
    await db.collection('users').doc(uid).update({
      disabled:    true,
      disabled_at: admin.firestore.FieldValue.serverTimestamp(),
      disabled_by: req.uid,
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /enable-user ────────────────────────────────────────────────────────
app.post('/enable-user', verifyToken, async (req, res) => {
  const caller = req.callerProfile

  if (caller?.role !== 'manager') {
    return res.status(403).json({ error: 'Only managers can enable users' })
  }

  const { uid } = req.body

  try {
    await auth.updateUser(uid, { disabled: false })
    await db.collection('users').doc(uid).update({
      disabled:   false,
      enabled_at: admin.firestore.FieldValue.serverTimestamp(),
      enabled_by: req.uid,
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /admin/seed-data ────────────────────────────────────────────────────
// This route populates the Kyambogo University data
app.post('/admin/seed-data', verifyToken, async (req, res) => {
  const caller = req.callerProfile

  // Only allow 'manager' to trigger the seed
  if (caller?.role !== 'manager') {
    return res.status(403).json({ error: 'Permission denied. Manager role required.' })
  }

  try {
    const batch = db.batch()

    // --- 1. SITES DATA ---
    const SITES = [
      { id: "machine-shop", name: "Machine Shop", location: "Faculty of Engineering, Kyambogo", region: "Kampala" },
      { id: "welding-fabrication", name: "Welding and Fabrication", location: "Faculty of Engineering, Kyambogo", region: "Kampala" }
    ]

    // --- 2. ASSETS DATA ---
    const ASSETS = [
      { id: "asset-001", asset_code: "OTH-101-KYU-26", name: "Milford 14\" Pedestal Grinder", category: "other", site_id: "machine-shop", status: "maintenance", pm_interval_days: 90, notes: "Belt replaced. Grinding wheel clearing needed." },
      { id: "asset-002", asset_code: "OTH-102-KYU-26", name: "Shearing Machine (Guillotine)", category: "other", site_id: "welding-fabrication", status: "maintenance", pm_interval_days: 60, notes: "Recurring: blade misalignment." },
      { id: "asset-003", asset_code: "OTH-103-KYU-26", name: "A-C Arc Welder", category: "other", site_id: "welding-fabrication", status: "operational", pm_interval_days: 90, notes: "Damage to cables by students." },
      { id: "asset-004", asset_code: "OTH-104-KYU-26", name: "CNC Vertical Milling Machine", category: "other", site_id: "machine-shop", status: "operational", pm_interval_days: 30, notes: "Recurring issues: air pipe breakage." },
      { id: "asset-005", asset_code: "OTH-105-KYU-26", name: "Conventional Lathe", category: "other", site_id: "machine-shop", status: "maintenance", pm_interval_days: 60, notes: "Needs repair." },
      { id: "asset-006", asset_code: "OTH-106-KYU-26", name: "Universal Milling Machine", category: "other", site_id: "machine-shop", status: "operational", pm_interval_days: 30, notes: "Good condition." },
      { id: "asset-007", asset_code: "OTH-107-KYU-26", name: "Surface Grinder", category: "other", site_id: "machine-shop", status: "maintenance", pm_interval_days: 60, notes: "Troubleshooting DC output relay." },
      { id: "asset-008", asset_code: "OTH-108-KYU-26", name: "Mascot Lathe", category: "other", site_id: "machine-shop", status: "overdue", pm_interval_days: 90, notes: "Restoring cross-slide carrier." }
    ]

    // --- 3. PARTS DATA ---
    const PARTS = [
      { name: 'Pneumatic Air Hose (8mm)', part_code: 'CNC-PH-08', category: 'Pneumatics', unit: 'metre', supplier: 'Kampala Industrial Equipment' },
      { name: 'CNC Tool Holder BT40', part_code: 'CNC-TH-BT40', category: 'Tooling', unit: 'piece', supplier: 'Vemack Official' },
      { name: 'Lathe Drive Belt', part_code: 'LTH-BELT-B', category: 'Belts', unit: 'piece', supplier: 'Industrial Belts Ltd' },
      { name: "Welding Electrode Holder", part_code: "WLD-EH-300", category: "Welding", unit: "piece", supplier: "Desbro Uganda" },
      { name: "Grinding Wheel (14 inch)", part_code: "GRD-WHL-14", category: "Consumables", unit: "piece", supplier: "Hardware World" },
      { name: "Machine Oil ISO 68", part_code: "LUB-OIL-68", category: "Lubricants", unit: "litre", supplier: "TotalEnergies Uganda" }
    ]

    // Execution
    SITES.forEach(s => batch.set(db.collection('sites').doc(s.id), s))
    ASSETS.forEach(a => {
      batch.set(db.collection('assets').doc(a.id), {
        ...a,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      })
    })
    PARTS.forEach(p => {
      const ref = db.collection('parts_catalogue').doc()
      batch.set(ref, { ...p, in_stock: true, current_stock: 10, created_at: admin.firestore.FieldValue.serverTimestamp() })
    })

    await batch.commit()
    res.json({ success: true, message: "Kyambogo data seeded!" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Schedule Task ─────────────────────────────────────────────────────────────
app.post('/schedule-task', verifyToken, async (req, res) => {
  const caller = req.callerProfile
  if (!['head_of_department', 'technician'].includes(caller?.role)) {
    return res.status(403).json({ error: 'Permission denied' })
  }
  const { asset_id, scheduled_for, task_type, notes, assigned_to } = req.body
  try {
    const ref = db.collection('scheduled_tasks').doc()
    await ref.set({
      asset_id, scheduled_for, task_type,
      notes: notes || '',
      assigned_to: assigned_to || null,
      created_by: req.uid,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })
    res.json({ id: ref.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Assest report ─────────────────────────────────────────────────────────────
app.get('/asset-report/:assetId', verifyToken, async (req, res) => {
  // All roles can access — no role restriction beyond being logged in
  try {
    const assetDoc = await db.collection('assets').doc(req.params.assetId).get()
    if (!assetDoc.exists) return res.status(404).json({ error: 'Asset not found' })

    const logsSnap = await db.collection('maintenance_logs')
      .where('asset_id', '==', req.params.assetId)
      .orderBy('logged_at', 'desc').limit(20).get()

    const partsSnap = await db.collection('spare_parts')
      .where('asset_id', '==', req.params.assetId)
      .orderBy('used_at', 'desc').limit(50).get()

    res.json({
      asset: { id: assetDoc.id, ...assetDoc.data() },
      logs:  logsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      parts: partsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      generated_at: new Date().toISOString(),
      generated_by: req.uid,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`)
})
