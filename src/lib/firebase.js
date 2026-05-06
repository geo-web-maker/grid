// src/lib/firebase.js
// Replace the firebaseConfig values with your actual Firebase project credentials.
// Get them from: Firebase Console → Project Settings → Your apps → SDK setup

import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app  = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db = initializeFirestore(app, {
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})


// Enable offline persistence (IndexedDB-backed Firestore cache)
//enableIndexedDbPersistence(db).catch((err) => {
// if (err.code === 'failed-precondition') {
//    console.warn('Firestore persistence unavailable: multiple tabs open.')
//  } else if (err.code === 'unimplemented') {
//    console.warn('Firestore persistence not supported in this browser.')
//  }
//})

// Uncomment to use local Firebase emulators during development:
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099')
//   connectFirestoreEmulator(db, 'localhost', 8080)
//   connectStorageEmulator(storage, 'localhost', 9199)
// }
