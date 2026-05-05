// src/lib/firestoreService.js
// All Firestore read/write operations in one place.
// Components call these instead of touching Firestore directly.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { uploadPhotos } from './r2Storage'
import { enqueueOperation, saveLocalLog, saveLocalParts, cacheAssets } from './localDb'
import { nanoid } from '../lib/nanoid'

// ─── Assets ────────────────────────────────────────────────────────────────

export async function fetchAllAssets(siteId = null) {
  let q = collection(db, 'assets')
  if (siteId) q = query(q, where('site_id', '==', siteId))
  const snap = await getDocs(q)
  const assets = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  await cacheAssets(assets) // persist to local IndexedDB
  return assets
}

export async function fetchAssetByCode(assetCode) {
  const q = query(
    collection(db, 'assets'),
    where('asset_code', '==', assetCode),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function createAsset(data) {
  const assetRef = doc(collection(db, 'assets'))
  const asset = {
    ...data,
    id:         assetRef.id,
    status:     'operational',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }
  await setDoc(assetRef, asset)
  return asset
}

export async function updateAssetStatus(assetId, status) {
  await updateDoc(doc(db, 'assets', assetId), {
    status,
    updated_at: serverTimestamp(),
  })
}

// ─── Maintenance Logs ───────────────────────────────────────────────────────

export async function fetchLogsForAsset(assetId, maxCount = 20) {
  const q = query(
    collection(db, 'maintenance_logs'),
    where('asset_id', '==', assetId),
    orderBy('logged_at', 'desc'),
    limit(maxCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchRecentLogs(technicianId = null, maxCount = 30) {
  let q = query(
    collection(db, 'maintenance_logs'),
    orderBy('logged_at', 'desc'),
    limit(maxCount)
  )
  if (technicianId) {
    q = query(
      collection(db, 'maintenance_logs'),
      where('technician_id', '==', technicianId),
      orderBy('logged_at', 'desc'),
      limit(maxCount)
    )
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchPendingApprovals() {
  const q = query(
    collection(db, 'maintenance_logs'),
    where('status', '==', 'pending'),
    orderBy('submitted_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function submitMaintenanceLog(logData, photoFiles = [], parts = []) {
  const logId = nanoid()
  const isOnline = navigator.onLine

  // Upload photos if online
  let photoUrls = []
  if (isOnline && photoFiles.length) {
    photoUrls = await uploadPhotos(logId, photoFiles)
  }

  const log = {
    id:             logId,
    asset_id:       logData.asset_id,
    technician_id:  logData.technician_id,
    type:           logData.type,
    status:         'pending',
    work_performed: logData.work_performed,
    findings:       logData.findings || '',
    duration_hours: parseFloat(logData.duration_hours) || 0,
    photo_urls:     photoUrls,
    logged_at:      logData.logged_at || new Date().toISOString(),
    submitted_at:   new Date().toISOString(),
    synced:         false,
  }

  // Always save locally first
  await saveLocalLog(log)

  // Save parts locally
  if (parts.length) {
    const partsWithIds = parts.map((p) => ({
      ...p,
      id:        nanoid(),
      log_id:    logId,
      asset_id:  logData.asset_id,
      used_at:   log.logged_at,
    }))
    await saveLocalParts(partsWithIds)
  }

  if (isOnline) {
    try {
      await setDoc(doc(db, 'maintenance_logs', logId), {
        ...log,
        synced:    true,
        logged_at: serverTimestamp(),
      })

      if (parts.length) {
        await Promise.all(
          parts.map((p) =>
            addDoc(collection(db, 'spare_parts'), {
              ...p,
              log_id:   logId,
              asset_id: logData.asset_id,
              used_at:  serverTimestamp(),
            })
          )
        )
      }

      return { id: logId, synced: true }
    } catch (err) {
      // Firestore write failed — queue for later
      await enqueueOperation({
        collection: 'maintenance_logs',
        doc_id:     logId,
        operation:  'create',
        payload:    log,
      })
      return { id: logId, synced: false }
    }
  } else {
    // Offline — queue the write
    await enqueueOperation({
      collection: 'maintenance_logs',
      doc_id:     logId,
      operation:  'create',
      payload:    log,
    })
    return { id: logId, synced: false }
  }
}

export async function approveLog(logId, supervisorId) {
  await updateDoc(doc(db, 'maintenance_logs', logId), {
    status:      'approved',
    approved_by: supervisorId,
    approved_at: serverTimestamp(),
    updated_at:  serverTimestamp(),
  })
}

// ─── Reminders ──────────────────────────────────────────────────────────────

export async function fetchReminders(siteId = null) {
  let q = query(
    collection(db, 'reminders'),
    where('status', 'in', ['pending', 'overdue']),
    orderBy('due_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function subscribeToReminders(callback) {
  const q = query(
    collection(db, 'reminders'),
    where('status', 'in', ['pending', 'overdue']),
    orderBy('due_date', 'asc'),
    limit(20)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export async function fetchSites() {
  const snap = await getDocs(collection(db, 'sites'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function upsertUserProfile(uid, data) {
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updated_at: serverTimestamp() },
    { merge: true }
  )
}
