// src/store/useAppStore.js
// Central Zustand store. Keeps auth state, online/offline status,
// sync state, and cached asset/log data accessible across all components.

import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // ─── Auth ────────────────────────────────────────────────────────────────
  user:        null,
  userProfile: null,
  authReady:   false,

  setUser:        (user)        => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setAuthReady:   (authReady)   => set({ authReady }),

  // ─── Network ─────────────────────────────────────────────────────────────
  isOnline: navigator.onLine,
  setOnline: (isOnline) => set({ isOnline }),

  // ─── Sync ────────────────────────────────────────────────────────────────
  isSyncing:     false,
  lastSyncedAt:  null,
  queueCount:    0,

  setSyncing:    (isSyncing)    => set({ isSyncing }),
  setLastSynced: (lastSyncedAt) => set({ lastSyncedAt }),
  setQueueCount: (queueCount)   => set({ queueCount }),

  // ─── Assets ──────────────────────────────────────────────────────────────
  assets: [],
  setAssets: (assets) => set({ assets }),

  updateAsset: (id, patch) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  // ─── Maintenance logs ────────────────────────────────────────────────────
  recentLogs: [],
  setRecentLogs: (recentLogs) => set({ recentLogs }),

  prependLog: (log) =>
    set((s) => ({ recentLogs: [log, ...s.recentLogs].slice(0, 50) })),

  // ─── Reminders ───────────────────────────────────────────────────────────
  reminders: [],
  setReminders: (reminders) => set({ reminders }),

  // ─── Active scan / selected asset ────────────────────────────────────────
  scannedAsset: null,
  setScannedAsset: (scannedAsset) => set({ scannedAsset }),
  clearScannedAsset: () => set({ scannedAsset: null }),

  // ─── UI state ────────────────────────────────────────────────────────────
  toasts: [],
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export default useAppStore
