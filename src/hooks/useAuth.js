// src/hooks/useAuth.js
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAuthInit() {
  const { setUser, setUserProfile, setAuthReady } = useAppStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const profile = await fetchUserProfile(firebaseUser.uid)
          setUserProfile(profile)
        } catch (err) {
          // Offline — Firestore cache may still have the profile
          console.warn('Could not fetch profile, trying local cache:', err.message)
          try {
            const { getDoc, doc } = await import('firebase/firestore')
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (snap.exists()) setUserProfile({ id: snap.id, ...snap.data() })
          } catch {
            // Truly nothing available — app continues with null profile
            console.warn('No cached profile available offline')
          }
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setAuthReady(true)  // ← always set this, even if profile fetch failed
    })
    return unsub
  }, [])
}
