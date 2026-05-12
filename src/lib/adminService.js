// src/lib/adminService.js
// All Firestore operations for the admin section.
// Only callable by users with role: 'manager'.

import {
  collection, doc, getDocs, getDoc,
  setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from './firebase'
import { nanoid } from './nanoid'

// ─── Users ──────────────────────────────────────────────────────────────────

export async function fetchAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('name')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

async function getAuthHeader() {
  const user  = getAuth().currentUser
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

const API = import.meta.env.VITE_ADMIN_API_URL

export async function createUser(data) {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/create-user`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body:    JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json
}

export async function disableUser(uid) {
  const headers = await getAuthHeader()
  const res = await fetch(`${API}/disable-user`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body:    JSON.stringify({ uid }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updated_at: serverTimestamp(),
  })
}


// ─── Assets ─────────────────────────────────────────────────────────────────

export async function fetchAllAssetsAdmin() {
  const snap = await getDocs(query(collection(db, 'assets'), orderBy('name')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createAsset(data) {
  const id = nanoid()
  const asset = {
    id,
    asset_code:       generateAssetCode(data.category, data.site_id),
    name:             data.name,
    category:         data.category,
    site_id:          data.site_id,
    status:           data.status || 'operational',
    make:             data.make        || '',
    model:            data.model       || '',
    serial_number:    data.serial_number || '',
    year_acquired:    data.year_acquired || '',
    pm_interval_days: parseInt(data.pm_interval_days) || 30,
    installed_at:     serverTimestamp(),
    next_pm_due:      nextPmDue(parseInt(data.pm_interval_days) || 30),
    created_at:       serverTimestamp(),
    updated_at:       serverTimestamp(),
    notes:            data.notes || '',
  }
  await setDoc(doc(db, 'assets', id), asset)
  return asset
}

export async function updateAsset(id, data) {
  await updateDoc(doc(db, 'assets', id), {
    name:             data.name,
    category:         data.category,
    site_id:          data.site_id,
    status:           data.status,
    make:             data.make        || '',
    model:            data.model       || '',
    serial_number:    data.serial_number || '',
    year_acquired:    data.year_acquired || '',
    pm_interval_days: parseInt(data.pm_interval_days) || 30,
    notes:            data.notes || '',
    updated_at:       serverTimestamp(),
  })
}

export async function deleteAsset(id) {
  await deleteDoc(doc(db, 'assets', id))
}

// ─── Spare parts catalogue ───────────────────────────────────────────────────

export async function fetchPartsCatalogue() {
  const snap = await getDocs(query(collection(db, 'parts_catalogue'), orderBy('name')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createPart(data) {
  const ref = await addDoc(collection(db, 'parts_catalogue'), {
    name:        data.name,
    part_code:   data.part_code || generatePartCode(data.name),
    category:    data.category,
    unit:        data.unit,
    supplier:    data.supplier || '',
    notes:       data.notes || '',
    in_stock:    true,
    created_at:  serverTimestamp(),
    updated_at:  serverTimestamp(),
  })
  return { id: ref.id }
}

export async function updatePart(id, data) {
  await updateDoc(doc(db, 'parts_catalogue'), {
    ...data,
    updated_at: serverTimestamp(),
  })
}

export async function deletePart(id) {
  await deleteDoc(doc(db, 'parts_catalogue', id))
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export async function fetchAllSites() {
  const snap = await getDocs(collection(db, 'sites'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createSite(data) {
  const id = data.name.toLowerCase().replace(/\s+/g, '-')
  await setDoc(doc(db, 'sites', id), {
    id,
    name:       data.name,
    location:   data.location,
    region:     data.region,
    created_at: serverTimestamp(),
  })
  return { id }
}

export async function updateSite(id, data) {
  await updateDoc(doc(db, 'sites', id), {
    ...data,
    updated_at: serverTimestamp(),
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_CODES = {
  lathe:    'LTH',
  grinder:  'GRD',
  milling:  'MIL',
  welder:   'WLD',
  shaper:   'SHP',
  shearing: 'SHR',
  hobbing:  'HOB',
  other:    'OTH',
}

const SITE_CODES = {
  'machine-shop':        'MCH',
  'welding-fabrication': 'WLD',
}


export function generateAssetCode(category, siteId) {
  const catCode  = CATEGORY_CODES[category] || 'OTH'
  const siteCode = SITE_CODES[siteId] || siteId.toUpperCase().slice(0, 3)
  const serial   = String(Math.floor(Math.random() * 900) + 100)
  const year     = String(new Date().getFullYear()).slice(-2)
  return `${catCode}-${serial}-${siteCode}-${year}`
}

function generatePartCode(name) {
  const words = name.trim().toUpperCase().split(/\s+/)
  const abbr  = words.map(w => w[0]).join('').slice(0, 3)
  const num   = String(Math.floor(Math.random() * 9000) + 1000)
  return `${abbr}-${num}`
}

function nextPmDue(intervalDays) {
  const d = new Date()
  d.setDate(d.getDate() + intervalDays)
  return d
}

export { CATEGORY_CODES, SITE_CODES }
