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
export const localStore: KeyValueStore = {
  get: <T>(key: string) => operate<T | undefined>('readonly', (store, tx, resolve, reject) => {
    const req = store.get(key)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve(req.result as T | undefined)
  }),
  set: <T>(key: string, value: T) => operate<void>('readwrite', (store, tx, resolve, reject) => {
    const req = store.put(value, key)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve()
  }),
}
// Snapshot only the app's own database. No OAuth token is included.
export async function exportLocalData(): Promise<Record<string, unknown>> {
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
}
export async function clearLocalData(): Promise<void> {
  return operate('readwrite', (store, tx, resolve, reject) => {
    const req = store.clear()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => resolve()
  })
}
export const READING_PLAN = 'reading-plan'
export type ReadingPlan = 'anual' | 'cronologico' | 'antigo' | 'novo' | 'trilhas'
