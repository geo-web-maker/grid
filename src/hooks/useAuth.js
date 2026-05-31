// src/hooks/useAuth.js
import { useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { fetchUserProfile } from '../lib/firestoreService'
import useAppStore from '../store/useAppStore'

export function useAuthInit() {
  const { setUser, setUserProfile, setAuthReady } = useAppStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Always set authReady immediately so the app doesn't hang
        // We'll update the profile whenever we can get it
        setAuthReady(true)

        try {
          const profile = await fetchUserProfile(firebaseUser.uid)
          if (profile) setUserProfile(profile)
        } catch (err) {
          console.warn('fetchUserProfile failed, trying Firestore cache:', err.message)
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (snap.exists()) setUserProfile({ id: snap.id, ...snap.data() })
          } catch (err2) {
            console.warn('No cached profile available:', err2.message)
            // Set a minimal profile so the app can still render
            setUserProfile({
              uid:   firebaseUser.uid,
              email: firebaseUser.email,
              name:  firebaseUser.displayName || firebaseUser.email,
              role:  'technician', // safe default
            })
          }
        }
      } else {
        setUser(null)
        setUserProfile(null)
        setAuthReady(true)
      }
    })
    return unsub
  }, [])
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logout() {
  await signOut(auth)
}
