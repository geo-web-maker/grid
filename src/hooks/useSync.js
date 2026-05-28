// src/hooks/useSync.js
import { useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { initAutoSync } from '../lib/syncEngine'
import { getPendingQueue } from '../lib/localDb'

export function useSyncInit() {
  const {authReady, setOnline, setSyncing, setLastSynced, setQueueCount, addToast } = useAppStore()

  useEffect(() => {
    if (!authReady) return //this is a guard
    
    // Refresh queue count from local DB — call this after any sync or status change
    const refreshCount = async () => {
      const queue = await getPendingQueue()
      setQueueCount(queue.length)
    }

    // Track online/offline
    const handleOnline  = () => { setOnline(true);  refreshCount() }
    const handleOffline = () => { setOnline(false); refreshCount() }
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Kick off auto-sync
    const cleanup = initAutoSync(async (result) => {
      setSyncing(false)
      setLastSynced(new Date())
      await refreshCount()   // ← always reflects actual post-sync state
      if (result?.synced > 0) {
        addToast(`Synced ${result.synced} record${result.synced > 1 ? 's' : ''}`, 'success')
      }
    })

    // ← Set correct count immediately on mount
    refreshCount()

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      cleanup()
    }
  }, [authReady]) //add authReady to the dependency array
}
