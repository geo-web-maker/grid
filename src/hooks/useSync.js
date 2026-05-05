// src/hooks/useSync.js
import { useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { initAutoSync } from '../lib/syncEngine'
import { getPendingQueue } from '../lib/localDb'

export function useSyncInit() {
  const { setOnline, setSyncing, setLastSynced, setQueueCount, addToast } = useAppStore()

  useEffect(() => {
    // Track online/offline
    const handleOnline  = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Kick off auto-sync
    const cleanup = initAutoSync(async (result) => {
      setSyncing(false)
      setLastSynced(new Date())
      const queue = await getPendingQueue()
      setQueueCount(queue.length)
      if (result.synced > 0) {
        addToast(`Synced ${result.synced} record${result.synced > 1 ? 's' : ''}`, 'success')
      }
    })

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      cleanup()
    }
  }, [])
}
