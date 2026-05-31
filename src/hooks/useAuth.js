// src/hooks/useAuth.js
import { useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { fetchUserProfile } from '../lib/firestoreService'
import useAppStore from '../store/useAppStore'

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
          console.warn('Could not fetch profile, trying local cache:', err.message)
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (snap.exists()) setUserProfile({ id: snap.id, ...snap.data() })
          } catch {
            console.warn('No cached profile available offline')
          }
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setAuthReady(true)
    })
    return unsub
  }, [])
}

// ← these two were missing, LoginPage imports login and logout from here
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logout() {
  await signOut(auth)
}
