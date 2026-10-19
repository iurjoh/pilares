import { clearToken, revocationToken, revokeToken } from './google'
import { clearSelection } from './library'

export type RevocationState = 'checking' | 'revoked' | 'failed' | 'unavailable'
export interface DisconnectResult { revocation: RevocationState; localCleared: boolean }
const NOTICE_KEY = 'pilares:gdrive:disconnect-result'
const SIGNAL_KEY = 'pilares:gdrive:disconnect-signal'
let pending: Promise<DisconnectResult> | null = null

export function lastDisconnectResult(): DisconnectResult | null {
  try {
    const raw = sessionStorage.getItem(NOTICE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as DisconnectResult
    if (!['checking', 'revoked', 'failed', 'unavailable'].includes(value.revocation) || typeof value.localCleared !== 'boolean') return null
    // A reload may interrupt a pending Google response. Never turn it into a success.
    return value.revocation === 'checking' && !pending ? { ...value, revocation: 'failed' } : value
  } catch { return null }
}
export function clearDisconnectNotice() {
  try { sessionStorage.removeItem(NOTICE_KEY) } catch { /* unavailable storage */ }
}
function announce(result: DisconnectResult) {
  try { sessionStorage.setItem(NOTICE_KEY, JSON.stringify(result)) } catch { /* UI also receives the event */ }
  window.dispatchEvent(new CustomEvent('pilares:library-updated', { detail: result }))
}
function clearLocalConnection(): boolean {
  clearToken()
  clearSelection()
  try { return sessionStorage.getItem('pilares:gdrive:token') === null && localStorage.getItem('pilares:library') === null }
  catch { return false }
}

// localStorage broadcasts only a non-secret signal. Each tab clears its own session token.
window.addEventListener('storage', event => {
  if (event.key !== SIGNAL_KEY || event.newValue === null) return
  clearToken()
  window.dispatchEvent(new Event('pilares:library-updated'))
})

export function disconnectLibrary(): Promise<DisconnectResult> {
  if (pending) return pending
  const token = revocationToken()
  const localCleared = clearLocalConnection()
  try { localStorage.setItem(SIGNAL_KEY, `${Date.now()}:${Math.random()}`) } catch { /* local result still reported */ }
  const initial: DisconnectResult = { revocation: token ? 'checking' : 'unavailable', localCleared }
  announce(initial)
  if (!token) return Promise.resolve(initial)
  pending = (async () => {
    let revocation: RevocationState = 'failed'
    try { await revokeToken(token); revocation = 'revoked' } catch { /* manual account-level removal remains available */ }
    const result = { revocation, localCleared }
    announce(result)
    return result
  })().finally(() => { pending = null })
  return pending
}
export function disconnectInProgress() { return pending !== null }
