import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localStore, clearLocalData, exportLocalData } from '../lib/store'

beforeEach(async () => { vi.restoreAllMocks(); await clearLocalData(); localStorage.clear() })
describe('interrupted local writes', () => {
  it('stages a write before the asynchronous database opens', async () => {
    const original = indexedDB.open.bind(indexedDB)
    let release: (() => void) | undefined
    vi.spyOn(indexedDB, 'open').mockImplementation(((...args: Parameters<IDBFactory['open']>) => {
      const request = original(...args)
      request.addEventListener('success', () => { release = () => callback?.call(request, new Event('success')) })
      let callback: ((e: Event) => unknown) | undefined
      Object.defineProperty(request, 'onsuccess', { set(fn) { callback = fn } })
      return request
    }) as IDBFactory['open'])
    const pending = localStore.set('synthetic', { value: 1 })
    expect(Object.keys(localStorage).some(k => k.startsWith('pilares:pending-write:'))).toBe(true)
    await vi.waitFor(() => expect(release).toBeDefined())
    release?.(); await pending
    expect(Object.keys(localStorage).some(k => k.startsWith('pilares:pending-write:'))).toBe(false)
  })
  it('replays a staged record before read and includes it in export', async () => {
    localStorage.setItem('pilares:pending-write:synthetic', JSON.stringify({ id: 'recovered', value: { water: 1 } }))
    expect(await localStore.get('synthetic')).toEqual({ water: 1 })
    expect(await exportLocalData()).toMatchObject({ synthetic: { water: 1 } })
  })
  it('commits rapid writes in order and clears only the latest matching journal', async () => {
    await Promise.all([localStore.set('synthetic', 1), localStore.set('synthetic', 2)])
    expect(await localStore.get('synthetic')).toBe(2)
    expect(localStorage.getItem('pilares:pending-write:synthetic')).toBeNull()
  })
  it('delete removes both staged recovery and committed records', async () => {
    localStorage.setItem('pilares:pending-write:synthetic', JSON.stringify({ id: 'pending', value: 'private-fixture' }))
    await clearLocalData()
    expect(await localStore.get('synthetic')).toBeUndefined()
    expect(localStorage.getItem('pilares:pending-write:synthetic')).toBeNull()
  })
  it('fails visibly when recovery storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError') })
    await expect(localStore.set('synthetic', 3)).rejects.toThrow()
  })
})
