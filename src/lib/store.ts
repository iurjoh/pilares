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
let writes: Promise<unknown> = Promise.resolve()
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = writes.catch(() => {}).then(work)
  writes = result
  return result
}
function pendingEntries(): [string, string][] {
  return Object.keys(localStorage).filter(k => k.startsWith(JOURNAL)).map(k => [k.slice(JOURNAL.length), localStorage.getItem(k)!])
}
async function commit(key: string, raw: string): Promise<void> {
  const entry = JSON.parse(raw) as { id?: unknown; value?: unknown }
  if (typeof entry.id !== 'string' || !Object.hasOwn(entry, 'value')) throw new Error('Invalid local recovery record')
  await operate<void>('readwrite', (store, tx, resolve, reject) => {
    const req = store.put(entry.value, key)
    req.onerror = () => reject(req.error)
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
      const raw = JSON.stringify({ id: crypto.randomUUID(), value })
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
  return serialize(async () => {
    const pending = pendingEntries()
    await operate<void>('readwrite', (store, tx, resolve, reject) => {
    const req = store.clear()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve()
    })
    for (const [key, raw] of pending) if (localStorage.getItem(JOURNAL + key) === raw) localStorage.removeItem(JOURNAL + key)
  })
}
export const READING_PLAN = 'reading-plan'
export type ReadingPlan = 'anual' | 'cronologico' | 'antigo' | 'novo' | 'trilhas'
