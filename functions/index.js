// functions/index.js
// Firebase Cloud Functions — runs server-side with Admin SDK privileges.
// Deploy with: firebase deploy --only functions

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp }      = require('firebase-admin/app')
const { getAuth }            = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()

// ─── Helper: verify caller is a manager ──────────────────────────────────────
async function assertCanCreateUser(auth, targetRole, targetSiteId) {
  if (!auth) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const doc = await getFirestore().collection('users').doc(auth.uid).get()
  const caller = doc.data()

  if (!caller || !['manager', 'supervisor'].includes(caller.role)) {
    throw new HttpsError('permission-denied', 'Only supervisors and managers can create users.')
  }

  if (caller.role === 'supervisor') {
    if (targetRole !== 'technician') {
      throw new HttpsError('permission-denied', 'Supervisors can only create technician accounts.')
    }
    if (targetSiteId !== caller.site_id) {
      throw new HttpsError('permission-denied', 'Supervisors can only add users to their own site.')
    }
  }

  return caller
}

async function assertManager(auth) {
  if (!auth) throw new HttpsError('unauthenticated', 'Must be signed in.')
  const doc = await getFirestore().collection('users').doc(auth.uid).get()
  if (!doc.exists || doc.data().role !== 'manager') {
    throw new HttpsError('permission-denied', 'Only managers can perform this action.')
  }
}

// ─── createUser ───────────────────────────────────────────────────────────────
// Creates a Firebase Auth account + Firestore profile in one atomic call.
exports.createUser = onCall(async (request) => {
  await assertCanCreateUser(request.auth, request.data.role, request.data.site_id)

  const { name, email, password, role, site_id, employee_id } = request.data

  if (!name || !email || !password || !role || !site_id) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  if (!['technician', 'supervisor', 'manager'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid role.')
  }

  // Create the Firebase Auth user
  let userRecord
  try {
    userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    })
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'A user with this email already exists.')
    }
    throw new HttpsError('internal', err.message)
  }

  // Create the Firestore profile
  await getFirestore().collection('users').doc(userRecord.uid).set({
    name,
    email,
    role,
    site_id,
    employee_id:  employee_id || null,
    disabled:     false,
    created_at:   FieldValue.serverTimestamp(),
    updated_at:   FieldValue.serverTimestamp(),
    created_by:   request.auth.uid,
  })

  return { uid: userRecord.uid, email: userRecord.email }
})

// ─── disableUser ─────────────────────────────────────────────────────────────
// Disables a Firebase Auth account so the user can no longer log in.
exports.disableUser = onCall(async (request) => {
if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.')

const callerDoc = await getFirestore().collection('users').doc(request.auth.uid).get()
const caller = callerDoc.data()

if (!caller || !['manager', 'supervisor'].includes(caller.role)) {
  throw new HttpsError('permission-denied', 'Not authorised.')
}

const { uid } = request.data
if (!uid) throw new HttpsError('invalid-argument', 'UID is required.')
if (uid === request.auth.uid) {
  throw new HttpsError('failed-precondition', 'You cannot disable your own account.')
}

const targetDoc = await getFirestore().collection('users').doc(uid).get()
const target = targetDoc.data()

if (caller.role === 'supervisor') {
  if (target?.role !== 'technician') {
    throw new HttpsError('permission-denied', 'Supervisors can only disable technicians.')
  }
  if (target?.site_id !== caller.site_id) {
    throw new HttpsError('permission-denied', 'Cannot disable users from another site.')
  }
}

  await getAuth().updateUser(uid, { disabled: true })

  await getFirestore().collection('users').doc(uid).update({
    disabled:    true,
    disabled_at: FieldValue.serverTimestamp(),
    disabled_by: request.auth.uid,
  })

  return { success: true }
})

// ─── enableUser ──────────────────────────────────────────────────────────────
exports.enableUser = onCall(async (request) => {
  await assertManager(request.auth)

  const { uid } = request.data
  if (!uid) throw new HttpsError('invalid-argument', 'UID is required.')

  await getAuth().updateUser(uid, { disabled: false })

  await getFirestore().collection('users').doc(uid).update({
    disabled:   false,
    enabled_at: FieldValue.serverTimestamp(),
    enabled_by: request.auth.uid,
  })

  return { success: true }
})
