// src/hooks/useAuth.js
import { useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { fetchUserProfile, upsertUserProfile } from '../lib/firestoreService'
import useAppStore from '../store/useAppStore'

export function useAuthInit() {
  const { setUser, setUserProfile, setAuthReady } = useAppStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const profile = await fetchUserProfile(firebaseUser.uid)
        setUserProfile(profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setAuthReady(true)
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
