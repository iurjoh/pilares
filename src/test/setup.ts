import 'fake-indexeddb/auto'

// Same-origin lock queue fixture; real multi-document coordination is covered in Chromium.
let locks: Promise<unknown> = Promise.resolve()
Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: (_name: string, work: () => Promise<unknown>) => {
  const result = locks.catch(() => {}).then(work); locks = result; return result
} } })
