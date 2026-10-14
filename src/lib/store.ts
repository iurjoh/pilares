// Local-first storage boundary. A later sync adapter can implement the same interface.
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
}
const DB = 'pilares-local-v1'
const STORE = 'settings'
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function operate<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, tx: IDBTransaction, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
      action(tx.objectStore(STORE), tx, resolve, reject)
    })
  } finally { db.close() }
}
const JOURNAL = 'pilares:pending-write:'
const QUARANTINE = 'pilares:quarantined-write:'
const EPOCH = 'pilares:write-epoch'
const epoch = () => localStorage.getItem(EPOCH) ?? 'initial'
// Web Locks are shared by same-origin documents. Do not fake cross-tab safety
// with a per-document Promise when the browser cannot supply it.
function exclusive<T>(work: () => Promise<T>): Promise<T> {
  if (!navigator.locks) return Promise.reject(new Error('Cross-tab storage coordination unavailable'))
  return navigator.locks.request('pilares-local-storage', work)
}
let writes: Promise<unknown> = Promise.resolve()
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = writes.catch(() => {}).then(() => exclusive(work))
  writes = result
  return result
}
function pendingEntries(): [string, string][] {
  return Object.keys(localStorage).filter(k => k.startsWith(JOURNAL)).map(k => [k.slice(JOURNAL.length), localStorage.getItem(k)!])
}
function decode(raw: string): { id: string; epoch?: string; value: unknown } | undefined {
  try {
    const entry = JSON.parse(raw)
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !Object.hasOwn(entry, 'value') || (entry.epoch !== undefined && typeof entry.epoch !== 'string')) return undefined
    return entry
  } catch { return undefined }
}
function quarantine(key: string, raw: string): void {
  // Quarantine remains local and is deleted with all app data. If storage is
  // full, leave the raw record in place but never let it block unrelated reads.
  try {
    localStorage.setItem(QUARANTINE + key, raw)
    if (localStorage.getItem(JOURNAL + key) === raw) localStorage.removeItem(JOURNAL + key)
  } catch { console.warn('Pilares: invalid recovery record could not be quarantined') }
}
async function commit(key: string, raw: string): Promise<void> {
  const entry = decode(raw)
  if (!entry) { quarantine(key, raw); return }
  const entryEpoch = entry.epoch ?? 'initial'
  if (localStorage.getItem(JOURNAL + key) !== raw) return
  if (entryEpoch !== epoch()) { localStorage.removeItem(JOURNAL + key); return }
  await operate<void>('readwrite', (store, tx, resolve, reject) => {
    // Recheck after asynchronous open: deletion or a newer edit can have
    // happened while this document waited. IDB transaction commits are atomic.
    if (entryEpoch === epoch() && localStorage.getItem(JOURNAL + key) === raw) {
      const req = store.put(entry.value, key)
      req.onerror = () => reject(req.error)
    }
    tx.oncomplete = () => resolve()
  })
  if (localStorage.getItem(JOURNAL + key) === raw) localStorage.removeItem(JOURNAL + key)
}
async function recover(): Promise<void> {
  for (const [key, raw] of pendingEntries()) await commit(key, raw)
}
export const localStore: KeyValueStore = {
  get: <T>(key: string) => serialize(async () => {
    await recover()
    return operate<T | undefined>('readonly', (store, tx, resolve, reject) => {
      const req = store.get(key)
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => resolve(req.result as T | undefined)
    })
  }),
  set: <T>(key: string, value: T): Promise<void> => {
    // Synchronous same-device journal survives a document exit before IDB opens.
    // Failure to stage must fail the save, never silently claim durability.
    try {
      const raw = JSON.stringify({ id: crypto.randomUUID(), epoch: epoch(), value })
      localStorage.setItem(JOURNAL + key, raw)
      return serialize(() => commit(key, raw)).catch(error => {
        // A known rejected transaction is not a crash-recovery candidate. The
        // caller keeps its failed edit and must explicitly retry it.
        if (localStorage.getItem(JOURNAL + key) === raw) localStorage.removeItem(JOURNAL + key)
        throw error
      })
    } catch (error) { return Promise.reject(error) }
  },
}
// Snapshot only the app's own database. No OAuth token is included.
export async function exportLocalData(): Promise<Record<string, unknown>> {
  return serialize(async () => {
    await recover()
    return operate('readonly', (store, tx, resolve, reject) => {
    const entries: Record<string, unknown> = {}
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        if (typeof cursor.key === 'string') entries[cursor.key] = cursor.value
        cursor.continue()
      }
    }
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve(entries)
    })
  })
}
export async function clearLocalData(): Promise<void> {
  // Invalidate already-staged writes immediately, including those in other
  // documents waiting for a lock or database open. Later edits use a new epoch.
  localStorage.setItem(EPOCH, crypto.randomUUID())
  const pending = pendingEntries()
  const quarantined = Object.keys(localStorage).filter(k => k.startsWith(QUARANTINE))
  return serialize(async () => {
    await operate<void>('readwrite', (store, tx, resolve, reject) => {
      const req = store.clear()
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => resolve()
    })
    for (const [key, raw] of pending) if (localStorage.getItem(JOURNAL + key) === raw) localStorage.removeItem(JOURNAL + key)
    for (const key of quarantined) localStorage.removeItem(key)
  })
}
export const READING_PLAN = 'reading-plan'
export type ReadingPlan = 'anual' | 'cronologico' | 'antigo' | 'novo' | 'trilhas'
