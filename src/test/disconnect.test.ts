import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearDisconnectNotice, disconnectLibrary, lastDisconnectResult } from '../drive/disconnect'
import { currentToken, revocationToken, REVOCATION_TIMEOUT_MS, revokeToken } from '../drive/google'

const revoked = vi.fn()
function seed(expiresAt = Date.now() + 3600000) {
  localStorage.setItem('pilares:library', JSON.stringify({ kind: 'files', files: [{ id: 'synthetic', name: 'Synthetic.pdf' }] }))
  sessionStorage.setItem('pilares:gdrive:token', JSON.stringify({ accessToken: 'synthetic-token', expiresAt }))
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); revoked.mockReset()
  const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; document.head.append(script)
  window.google = { accounts: { oauth2: { revoke: revoked } } }
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.querySelectorAll('script').forEach(s => s.remove()) })

describe('one bounded disconnect flow', () => {
  it('clears local state immediately and reports only confirmed Google success', async () => {
    seed(); revoked.mockImplementation((_token, done) => done({ successful: true }))
    const pending = disconnectLibrary()
    expect(sessionStorage.getItem('pilares:gdrive:token')).toBeNull()
    expect(localStorage.getItem('pilares:library')).toBeNull()
    expect(await pending).toEqual({ revocation: 'revoked', localCleared: true })
    expect(revoked).toHaveBeenCalledWith('synthetic-token', expect.any(Function))
    expect(lastDisconnectResult()?.revocation).toBe('revoked')
  })
  it.each([undefined, { successful: false, error: 'invalid_request' }])('does not turn callback failure %j into success', async response => {
    seed(); revoked.mockImplementation((_token, done) => done(response))
    expect(await disconnectLibrary()).toEqual({ revocation: 'failed', localCleared: true })
  })
  it('times out a callback that never arrives, without holding local data', async () => {
    vi.useFakeTimers(); seed(); revoked.mockImplementation(() => {})
    const pending = disconnectLibrary()
    const repeated = disconnectLibrary()
    expect(repeated).toBe(pending)
    expect(localStorage.getItem('pilares:library')).toBeNull()
    await vi.advanceTimersByTimeAsync(REVOCATION_TIMEOUT_MS + 1)
    expect(await pending).toEqual({ revocation: 'failed', localCleared: true })
    expect(revoked).toHaveBeenCalledTimes(1)
  })
  it.each(['missing', 'expired', 'corrupt'])('clears local data with a %s token and does not request new consent', async state => {
    seed(state === 'expired' ? Date.now() - 1 : Date.now() + 10000)
    if (state === 'missing') sessionStorage.removeItem('pilares:gdrive:token')
    if (state === 'corrupt') sessionStorage.setItem('pilares:gdrive:token', '{broken')
    expect(await disconnectLibrary()).toEqual({ revocation: 'unavailable', localCleared: true })
    expect(revoked).not.toHaveBeenCalled()
  })
  it('can revoke a still-valid token inside the request safety margin', async () => {
    seed(Date.now() + 10000); expect(currentToken()).toBeNull(); expect(revocationToken()).toBe('synthetic-token')
    revoked.mockImplementation((_token, done) => done({ successful: true }))
    expect((await disconnectLibrary()).revocation).toBe('revoked')
  })
  it('does not claim local cleanup when storage refuses removal', async () => {
    seed(); revoked.mockImplementation((_token, done) => done({ successful: true }))
    const real = Storage.prototype.removeItem
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key: string) {
      if (key === 'pilares:gdrive:token') throw new Error('storage denied')
      return real.call(this, key)
    })
    expect(await disconnectLibrary()).toEqual({ revocation: 'revoked', localCleared: false })
  })
  it('clears another tab session token on the non-secret disconnect signal', () => {
    seed(); window.dispatchEvent(new StorageEvent('storage', { key: 'pilares:gdrive:disconnect-signal', newValue: 'synthetic-signal' }))
    expect(sessionStorage.getItem('pilares:gdrive:token')).toBeNull()
  })
  it('treats an interrupted pending receipt as unconfirmed, never as revoked', () => {
    sessionStorage.setItem('pilares:gdrive:disconnect-result', JSON.stringify({ revocation: 'checking', localCleared: true }))
    expect(lastDisconnectResult()?.revocation).toBe('failed')
    clearDisconnectNotice(); expect(lastDisconnectResult()).toBeNull()
  })
  it('rejects a thrown Google SDK error', async () => {
    revoked.mockImplementation(() => { throw new Error('SDK unavailable') })
    await expect(revokeToken('synthetic-token')).rejects.toThrow()
  })
})
