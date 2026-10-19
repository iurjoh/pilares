// Loaders for Google Identity Services and the Google Picker, kept dependency-free.
import { DRIVE_SCOPE, GOOGLE_APP_ID, GOOGLE_API_KEY, GOOGLE_CLIENT_ID } from '../config'

declare global {
  interface Window { google?: any; gapi?: any }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.defer = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Falha ao carregar ${src}`))
    document.head.appendChild(el)
  })
}

let gsiPromise: Promise<void> | null = null
export function loadGsi(): Promise<void> {
  if (!gsiPromise) gsiPromise = loadScript('https://accounts.google.com/gsi/client')
  return gsiPromise
}

let pickerPromise: Promise<void> | null = null
export function loadPicker(): Promise<void> {
  if (!pickerPromise) {
    pickerPromise = loadScript('https://apis.google.com/js/api.js').then(
      () => new Promise<void>((resolve, reject) => {
        window.gapi.load('picker', { callback: () => resolve(), onerror: () => reject(new Error('picker load failed')) })
      }),
    )
  }
  return pickerPromise
}

const TOKEN_KEY = 'pilares:gdrive:token'
interface StoredToken { accessToken: string; expiresAt: number }

export function currentToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredToken
    if (!stored.accessToken || stored.expiresAt < Date.now() + 30_000) return null
    return stored.accessToken
  } catch { return null }
}

function storeToken(accessToken: string, expiresIn: number) {
  try {
    const stored: StoredToken = { accessToken, expiresAt: Date.now() + expiresIn * 1000 }
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
  } catch { /* storage unavailable */ }
}

export function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

// prompt '' attempts a silent refresh; 'select_account' shows the account chooser.
export function requestToken(prompt: '' | 'select_account'): Promise<string> {
  return loadGsi().then(() => new Promise<string>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp: any) => {
        if (resp && resp.access_token) {
          storeToken(resp.access_token, Number(resp.expires_in) || 3500)
          resolve(resp.access_token)
        } else {
          reject(new Error(resp?.error || 'no token'))
        }
      },
      error_callback: (err: any) => reject(new Error(err?.type || 'oauth error')),
    })
    client.requestAccessToken({ prompt })
  }))
}

// Revocation can use a token inside the API-request 30-second safety margin, but never an expired one.
export function revocationToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as StoredToken
    return typeof value.accessToken === 'string' && value.accessToken && Number.isFinite(value.expiresAt) && value.expiresAt > Date.now() ? value.accessToken : null
  } catch { return null }
}

export const REVOCATION_TIMEOUT_MS = 5000
export function revokeToken(token: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (error?: Error) => { if (settled) return; settled = true; window.clearTimeout(timer); if (error) reject(error); else resolve() }
    const timer = window.setTimeout(() => finish(new Error('revocation timeout')), REVOCATION_TIMEOUT_MS)
    loadGsi().then(() => {
      if (settled) return
      try {
        window.google.accounts.oauth2.revoke(token, (response: { successful?: boolean; error?: string } | undefined) => {
          if (response?.successful === true) finish(); else finish(new Error('revocation not confirmed'))
        })
      } catch { finish(new Error('revocation unavailable')) }
    }).catch(() => finish(new Error('revocation script unavailable')))
  })
}

export interface PickedFile { id: string; name: string }

function openPicker(build: (picker: any) => void): Promise<any[] | null> {
  return Promise.all([loadGsi(), loadPicker()]).then(() => new Promise<any[] | null>((resolve) => {
    const picker = window.google.picker
    const builder = new picker.PickerBuilder()
      .setDeveloperKey(GOOGLE_API_KEY)
      .setAppId(GOOGLE_APP_ID)
      .setOrigin(window.location.origin)
      .setCallback((data: any) => {
        if (data.action === 'picked') resolve(data.docs)
        else if (data.action === 'cancel') resolve(null)
      })
    build(builder)
    builder.build().setVisible(true)
  }))
}

// Opens the Picker for PDFs (multi-select). With drive.file only the picked files become readable.
// `startFolderId` opens the Picker inside that folder so the user can navigate its subfolders.
export async function pickPdfs(token: string, startFolderId?: string): Promise<PickedFile[] | null> {
  const docs = await openPicker((builder) => {
    const view = new window.google.picker.DocsView()
      .setMimeTypes('application/pdf')
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
    if (startFolderId && /^[A-Za-z0-9_-]{1,200}$/.test(startFolderId)) view.setParent(startFolderId)
    builder
      .addView(view)
      .setOAuthToken(token)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
  })
  if (!docs || docs.length === 0) return null
  return docs
    .filter((d: any) => d.mimeType === 'application/pdf')
    .map((d: any) => ({ id: d.id, name: d.name || 'documento.pdf' }))
}
