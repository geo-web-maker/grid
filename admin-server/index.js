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

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`)
})
