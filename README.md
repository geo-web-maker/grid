# UEGCL QR Logbook — PWA

A mobile-first Progressive Web App for Uganda Electricity Generation Company Limited (UEGCL). Replaces paper-based maintenance logbooks with a QR-coded digital system for hydropower assets at Nalubaale, Kiira, Isimba, and Karuma.

---

## Features

| Feature | Details |
|---|---|
| QR scanning | Scan asset tags with device camera; auto-resolve to asset record |
| Offline-first | Log records with zero connectivity; auto-syncs when back online |
| Photo evidence | Capture and auto-compress maintenance photos per log entry |
| Spare parts | Pick from admin-managed catalogue with autocomplete; tracks usage per job |
| Reminders | Preventive maintenance schedules with overdue alerts |
| Supervisor dashboard | Approvals queue, site compliance, parts usage reports |
| Admin panel | Managers create users, register assets, manage parts and sites |
| QR generation | Generate, preview, download and print QR tags from the app |
| Role-based access | Technician / Supervisor / Manager with Firestore security rules |

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 18 + Vite |
| PWA / Service Worker | vite-plugin-pwa + Workbox |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Cloud DB + Auth + Storage | Firebase v10 |
| Local DB | IndexedDB via idb |
| Offline sync | Custom sync engine + Workbox Background Sync |
| QR scanning | html5-qrcode |
| QR generation | qrious |
| State | Zustand |
| Forms | React Hook Form |
| Hosting | Vercel |
| DNS + CDN | Cloudflare |
| Functions | Firebase Cloud Functions (Node 20) |

---

## Project structure

```
uegcl-logbook/
├── .github/workflows/
│   ├── deploy.yml           # Auto-deploy frontend to Vercel on push to main
│   └── firebase.yml         # Auto-deploy rules + functions when changed
├── functions/
│   ├── index.js             # Cloud Functions: createUser, disableUser, enableUser
│   └── package.json
├── scripts/
│   └── seed.js              # Seed Firestore: sites, assets, reminders, parts catalogue
├── src/
│   ├── components/
│   │   ├── AppShell.jsx         # Top nav, status bar, bottom tab bar
│   │   ├── ToastContainer.jsx
│   │   └── admin/
│   │       ├── Modal.jsx        # Bottom-sheet modal for admin forms
│   │       └── ConfirmDialog.jsx
│   ├── hooks/
│   │   ├── useAuth.js           # Firebase Auth state watcher
│   │   └── useSync.js           # Online/offline + auto-sync watcher
│   ├── lib/
│   │   ├── firebase.js          # Firebase init + emulator config
│   │   ├── firestoreService.js  # All Firestore reads/writes
│   │   ├── adminService.js      # Admin CRUD + asset code generation
│   │   ├── localDb.js           # IndexedDB offline storage
│   │   ├── syncEngine.js        # Offline queue replay on reconnect
│   │   ├── qrGenerator.js       # QR generation, print, download PNG
│   │   └── nanoid.js            # Lightweight ID generator
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── HomePage.jsx         # Dashboard: stats, logs, reminders, chart
│   │   ├── AssetsPage.jsx       # Filterable asset list with category chips
│   │   ├── AssetDetailPage.jsx  # Asset info, maintenance history, parts used
│   │   ├── ScanPage.jsx         # QR scanner with simulate-scan for dev/test
│   │   ├── LogPage.jsx          # Maintenance log form with parts autocomplete
│   │   ├── SupervisorPage.jsx   # Approvals, compliance bars, parts reports
│   │   ├── ProfilePage.jsx      # Profile, sync status, settings, admin link
│   │   └── admin/
│   │       ├── AdminPage.jsx    # Tab shell: Users / Assets / Parts / Sites
│   │       ├── UsersAdmin.jsx   # Create, edit, disable users
│   │       ├── AssetsAdmin.jsx  # Register assets, generate and print QR codes
│   │       ├── PartsAdmin.jsx   # Manage spare parts catalogue
│   │       └── SitesAdmin.jsx   # Manage hydropower sites
│   ├── store/
│   │   └── useAppStore.js       # Zustand: auth, sync, assets, toasts, reminders
│   ├── styles/
│   │   └── index.css            # Tailwind + custom component classes
│   ├── App.jsx                  # Router + auth guard + splash screen
│   └── main.jsx                 # Entry point + service worker registration
├── firestore.rules              # Role-based Firestore security rules
├── firestore.indexes.json       # Composite indexes for all queries
├── storage.rules                # Photo upload rules (5MB max, images only)
├── firebase.json                # Firebase project config
├── vercel.json                  # SPA routing + security + cache headers
├── vite.config.js               # Vite + PWA plugin + Workbox config
├── tailwind.config.js           # Custom colors and font
└── .env.example                 # Environment variable template
```

---

## Local setup with Firebase emulators

### Prerequisites

```bash
conda create -n uegcl-logbook nodejs=20 -c conda-forge
conda activate uegcl-logbook
conda install -c conda-forge openjdk=17

node --version    # v20.x
java --version    # 17.x
```

### Install dependencies

```bash
unzip uegcl-logbook.zip && cd uegcl-logbook
npm install
cd functions && npm install && cd ..
npm install -g firebase-tools vercel
```

### Configure environment

```bash
cp .env.example .env
```

Use dummy values for local dev:

```
VITE_FIREBASE_API_KEY=fake-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=uegcl-logbook-dev
VITE_FIREBASE_STORAGE_BUCKET=uegcl-logbook-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Uncomment the emulator block in `src/lib/firebase.js`:

```js
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}
```

### Initialize emulators (first time only)

```bash
firebase init emulators
# Select: Authentication (9099), Firestore (8080), Storage (9199), Emulator UI (4000)
# Download emulator JARs when prompted (~150 MB, one time)
```

### Run locally

Terminal 1:
```bash
firebase emulators:start --project uegcl-logbook-dev
```

Terminal 2:
```bash
npm run dev
```

Open `http://localhost:5173`

### Seed demo data

```bash
firebase emulators:exec "node scripts/seed.js" --project uegcl-logbook-dev
```

Populates: 4 sites, 5 assets, 4 reminders, 15 spare parts in catalogue.

### Create first user

Open `http://localhost:4000` → Authentication → Add user:
```
Email:    manager@uegcl.co.ug
Password: Test1234!
```

Firestore → `users` collection → New document (use the Auth UID as document ID):
```json
{
  "name": "Site Manager",
  "email": "manager@uegcl.co.ug",
  "role": "manager",
  "site_id": "nalubaale",
  "employee_id": "UEGCL-0001"
}
```

Log in → Profile → Admin panel → create all other accounts from there.

### Save and restore emulator data between sessions

```bash
# Save data before stopping
firebase emulators:export ./emulator-data

# Restore on next run
firebase emulators:start --import=./emulator-data --project uegcl-logbook-dev
```

### Test offline mode

1. Chrome DevTools → Network tab → set throttling to **Offline**
2. Submit a maintenance log — saves to IndexedDB
3. Switch back to **Online**
4. App auto-syncs record to Firestore emulator

---

## Production deployment

### 1. Create Firebase project

- [console.firebase.google.com](https://console.firebase.google.com) → New project: `uegcl-logbook-prod`
- Enable Authentication → Email/Password
- Enable Firestore → region: `europe-west1` (closest to Uganda)
- Enable Storage
- Project Settings → Your apps → Add Web app → copy the config

### 2. Set real credentials

Fill production Firebase config into `.env`. Re-comment the emulator block in `firebase.js`.

### 3. Push to GitHub

```bash
git init && git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourname/uegcl-logbook.git
git push -u origin main
```

### 4. Deploy Firebase rules + functions

```bash
firebase login
firebase use --add    # select uegcl-logbook-prod
firebase deploy --only firestore,storage,functions
```

### 5. Connect Vercel

- [vercel.com](https://vercel.com) → New Project → import GitHub repo
- Add all 6 `VITE_FIREBASE_*` env vars in Settings → Environment Variables
- Deploy → test on `*.vercel.app` URL first

### 6. Set up Cloudflare DNS

In Cloudflare → your domain → DNS → Add record:
```
Type:  CNAME
Name:  logbook
Value: cname.vercel-dns.com
Proxy: ON (orange cloud)
```

In Vercel → Project → Settings → Domains → add your domain.

Cloudflare SSL: **Full (strict)**

Add a Cloudflare Cache Rule to bypass cache for `/sw.js` — critical for PWA updates to reach users.

### 7. Authorise domain in Firebase Auth

Firebase Console → Authentication → Settings → Authorized domains → add your domain.

### 8. Set up GitHub Actions secrets

GitHub repo → Settings → Secrets and variables → Actions:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VERCEL_TOKEN               ← vercel.com → Account → Tokens
VERCEL_ORG_ID              ← vercel.com → Account settings
VERCEL_PROJECT_ID          ← Vercel project → Settings
FIREBASE_SERVICE_ACCOUNT   ← Firebase Console → Service accounts → Generate key (JSON)
```

Every `git push` to `main` now auto-deploys frontend to Vercel and updates Firebase if rules or functions changed.

### 9. Seed production data

```bash
# Download service account key JSON from Firebase Console → Service accounts
# Save as serviceAccountKey.json in project root (never commit this file)
node scripts/seed.js
```

### 10. Create first manager account

Firebase Console → Authentication → Add user → copy the UID → Firestore → `users` → new document with that UID and `role: "manager"`. Then log in on your live URL and use the Admin panel for all further account creation.

---

## Asset QR code format

```
GEN-045-KLA-24
 │    │   │   └─ Year registered (24 = 2024)
 │    │   └───── Site code  NLB=Nalubaale  KLA=Kiira  ISM=Isimba  KRU=Karuma
 │    └───────── Serial number (045)
 └────────────── Category   TRB=Turbine  GEN=Generator  PMP=Pump  CMP=Compressor  CLG=Cooling  TRF=Transformer
```

QR codes encode the `asset_code` string only. Print on laminated PET or aluminium tags. Minimum 60×60mm for reliable scanning. Use **error correction level H** (already set) so codes survive partial damage or dirt.

---

## Roles and permissions

| Action | Technician | Supervisor | Manager |
|---|---|---|---|
| View assets and logs | ✓ | ✓ | ✓ |
| Submit maintenance log | ✓ | ✓ | ✓ |
| Upload photo evidence | ✓ | ✓ | ✓ |
| Approve logs | — | ✓ | ✓ |
| Register new asset + QR | — | ✓ | ✓ |
| Supervisor dashboard | — | ✓ | ✓ |
| Admin panel | — | — | ✓ |
| Create and disable users | — | — | ✓ |
| Manage parts catalogue | — | — | ✓ |
| Manage sites | — | — | ✓ |

---

## Offline behaviour

| Action | Online | Offline |
|---|---|---|
| View assets | Firestore + cache | IndexedDB cache |
| View logs | Firestore | IndexedDB cache |
| Submit log | Firestore immediately | Saved locally, queued for sync |
| Upload photos | Firebase Storage | Stored as blob, uploaded on reconnect |
| Pick spare part | Live catalogue | Cached catalogue |
| Approve log | Firestore immediately | Not available offline |
| Admin panel writes | Firestore immediately | Blocked (shows error) |

Offline queue retries up to 5 times per item. Items older than 24 hours are discarded from the queue.

---

## Cost at UEGCL scale

| Service | Free limit | Expected usage |
|---|---|---|
| Vercel (Hobby) | 100 GB/month | Well within free |
| Firebase Auth | 10,000 users/month | Fine |
| Firestore | 50k reads, 20k writes/day | Fine for ~100 users |
| Firebase Storage | 5 GB storage, 1 GB/day download | Fine |
| Firebase Functions | 2M invocations/month | Fine |
| Cloudflare | Unlimited DNS + CDN | Free forever |
| Domain | ~$10–15/year | One-time |

**Total running cost: ~$10–15/year** (domain only). Everything else runs on free tiers.

---

## License

Internal use — Uganda Electricity Generation Company Limited (UEGCL). All rights reserved.
