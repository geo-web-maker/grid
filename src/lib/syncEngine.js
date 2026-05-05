// src/lib/syncEngine.js
// Watches online/offline status and replays the offline queue
// against Firestore when the device comes back online.

import {
  doc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  getPendingQueue,
  markQueueItemSynced,
  incrementRetryCount,
  getUnsyncedLogs,
  markLogSynced,
  getUnsyncedParts,
  markPartSynced,
} from './localDb'

const MAX_RETRIES = 5

// ─── Replay a single queued operation against Firestore ─────────────────────

async function replayOperation(item) {
  const ref = item.doc_id
    ? doc(db, item.collection, item.doc_id)
    : doc(collection(db, item.collection))

  const payload = { ...item.payload, updated_at: serverTimestamp() }

  if (item.operation === 'create') {
    await setDoc(ref, payload)
  } else if (item.operation === 'update') {
    await updateDoc(ref, payload)
  }
}

// ─── Sync all pending items in the offline queue ─────────────────────────────

export async function syncOfflineQueue() {
  const pending = await getPendingQueue()
  if (!pending.length) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of pending) {
    if (item.retry_count >= MAX_RETRIES) {
      failed++
      continue
    }

    try {
      await replayOperation(item)
      await markQueueItemSynced(item.id)
      synced++
    } catch (err) {
      console.warn(`Sync failed for queue item ${item.id}:`, err.message)
      await incrementRetryCount(item.id)
      failed++
    }
  }

  return { synced, failed }
}

// ─── Sync unsynced maintenance logs ─────────────────────────────────────────

export async function syncLogs() {
  const logs = await getUnsyncedLogs()
  for (const log of logs) {
    try {
      const ref = doc(db, 'maintenance_logs', log.id)
      await setDoc(ref, { ...log, synced: true, synced_at: serverTimestamp() })
      await markLogSynced(log.id)
    } catch (err) {
      console.warn(`Failed to sync log ${log.id}:`, err.message)
    }
  }
}

// ─── Sync unsynced spare parts ───────────────────────────────────────────────

export async function syncParts() {
  const parts = await getUnsyncedParts()
  for (const part of parts) {
    try {
      const ref = doc(db, 'spare_parts', part.id)
      await setDoc(ref, { ...part, synced: true, synced_at: serverTimestamp() })
      await markPartSynced(part.id)
    } catch (err) {
      console.warn(`Failed to sync part ${part.id}:`, err.message)
    }
  }
}

// ─── Full sync — runs all sync operations in order ──────────────────────────

export async function runFullSync() {
  try {
    await syncLogs()
    await syncParts()
    const result = await syncOfflineQueue()
    console.info(`Sync complete: ${result.synced} synced, ${result.failed} failed`)
    return result
  } catch (err) {
    console.error('Full sync error:', err)
    return { synced: 0, failed: 0 }
  }
}

// ─── Auto-sync on connectivity restore ──────────────────────────────────────

export function initAutoSync(onSyncComplete) {
  const handleOnline = async () => {
    console.info('Network restored — starting sync...')
    const result = await runFullSync()
    if (onSyncComplete) onSyncComplete(result)
  }

  window.addEventListener('online', handleOnline)

  // If already online at startup, run an initial sync
  if (navigator.onLine) {
    runFullSync().then(onSyncComplete)
  }

  // Return cleanup function
  return () => window.removeEventListener('online', handleOnline)
}
