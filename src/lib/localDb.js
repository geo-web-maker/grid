// src/lib/localDb.js
// Wraps IndexedDB using the `idb` library.
// Stores assets, logs, spare parts, and an offline sync queue locally
// so the app works fully without a network connection.

import { openDB } from 'idb'

const DB_NAME    = 'uegcl-logbook'
const DB_VERSION = 1

let _db = null

export async function getLocalDb() {
  if (_db) return _db

  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Assets cache — seeded from Firestore on first sync
      if (!db.objectStoreNames.contains('assets')) {
        const assets = db.createObjectStore('assets', { keyPath: 'id' })
        assets.createIndex('site_id',    'site_id')
        assets.createIndex('status',     'status')
        assets.createIndex('asset_code', 'asset_code', { unique: true })
      }

      // Maintenance logs — includes unsynced entries created offline
      if (!db.objectStoreNames.contains('maintenance_logs')) {
        const logs = db.createObjectStore('maintenance_logs', { keyPath: 'id' })
        logs.createIndex('asset_id',      'asset_id')
        logs.createIndex('technician_id', 'technician_id')
        logs.createIndex('synced',        'synced')
        logs.createIndex('logged_at',     'logged_at')
      }

      // Spare parts — linked to logs
      if (!db.objectStoreNames.contains('spare_parts')) {
        const parts = db.createObjectStore('spare_parts', { keyPath: 'id' })
        parts.createIndex('log_id',   'log_id')
        parts.createIndex('asset_id', 'asset_id')
        parts.createIndex('synced',   'synced')
      }

      // Offline queue — pending write operations to replay when online
      if (!db.objectStoreNames.contains('offline_queue')) {
        const queue = db.createObjectStore('offline_queue', {
          keyPath: 'id',
          autoIncrement: true,
        })
        queue.createIndex('collection', 'collection')
        queue.createIndex('synced',     'synced')
        queue.createIndex('queued_at',  'queued_at')
      }
    },
  })

  return _db
}

// ─── Assets ────────────────────────────────────────────────────────────────

export async function cacheAssets(assets) {
  const db = await getLocalDb()
  const tx = db.transaction('assets', 'readwrite')
  await Promise.all(assets.map((a) => tx.store.put(a)))
  await tx.done
}

export async function getLocalAssets() {
  const db = await getLocalDb()
  return db.getAll('assets')
}

export async function getLocalAssetByCode(code) {
  const db = await getLocalDb()
  const idx = db.transaction('assets').store.index('asset_code')
  return idx.get(code)
}

// ─── Maintenance logs ───────────────────────────────────────────────────────

export async function saveLocalLog(log) {
  const db = await getLocalDb()
  await db.put('maintenance_logs', { ...log, synced: false })
}

export async function getLocalLogs(assetId) {
  const db  = await getLocalDb()
  const idx = db.transaction('maintenance_logs').store.index('asset_id')
  return idx.getAll(assetId)
}

export async function getUnsyncedLogs() {
  const db  = await getLocalDb()
  const idx = db.transaction('maintenance_logs').store.index('synced')
  return idx.getAll(false)
}

export async function markLogSynced(id) {
  const db  = await getLocalDb()
  const tx  = db.transaction('maintenance_logs', 'readwrite')
  const log = await tx.store.get(id)
  if (log) await tx.store.put({ ...log, synced: true })
  await tx.done
}

// ─── Spare parts ────────────────────────────────────────────────────────────

export async function saveLocalParts(parts) {
  const db = await getLocalDb()
  const tx = db.transaction('spare_parts', 'readwrite')
  await Promise.all(parts.map((p) => tx.store.put({ ...p, synced: false })))
  await tx.done
}

export async function getUnsyncedParts() {
  const db  = await getLocalDb()
  const idx = db.transaction('spare_parts').store.index('synced')
  return idx.getAll(false)
}

export async function markPartSynced(id) {
  const db   = await getLocalDb()
  const tx   = db.transaction('spare_parts', 'readwrite')
  const part = await tx.store.get(id)
  if (part) await tx.store.put({ ...part, synced: true })
  await tx.done
}

// ─── Offline queue ──────────────────────────────────────────────────────────

export async function enqueueOperation(operation) {
  // operation: { collection, doc_id, operation: 'create'|'update', payload }
  const db = await getLocalDb()
  await db.add('offline_queue', {
    ...operation,
    retry_count: 0,
    queued_at:   new Date().toISOString(),
    synced:      false,
  })
}

export async function getPendingQueue() {
  const db  = await getLocalDb()
  const idx = db.transaction('offline_queue').store.index('synced')
  return idx.getAll(false)
}

export async function markQueueItemSynced(id) {
  const db   = await getLocalDb()
  const tx   = db.transaction('offline_queue', 'readwrite')
  const item = await tx.store.get(id)
  if (item) await tx.store.put({ ...item, synced: true })
  await tx.done
}

export async function incrementRetryCount(id) {
  const db   = await getLocalDb()
  const tx   = db.transaction('offline_queue', 'readwrite')
  const item = await tx.store.get(id)
  if (item) await tx.store.put({ ...item, retry_count: (item.retry_count || 0) + 1 })
  await tx.done
}
