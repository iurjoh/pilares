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
async function operate<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      tx.onerror = () => reject(tx.error)
      action(tx.objectStore(STORE), resolve, reject)
    })
  } finally { db.close() }
}
export const localStore: KeyValueStore = {
  get: <T>(key: string) => operate<T | undefined>('readonly', (store, resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  }),
  set: <T>(key: string, value: T) => operate<void>('readwrite', (store, resolve, reject) => {
    const req = store.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }),
}
export const READING_PLAN = 'reading-plan'
export type ReadingPlan = 'anual' | 'cronologico' | 'antigo' | 'novo' | 'trilhas'
