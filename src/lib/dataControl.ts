import { clearLocalData, exportLocalData } from './store'
import { disconnectLibrary } from '../drive/disconnect'

const OWN_KEYS = ['pilares:library', 'pilares:lang', 'pilares:sensitive-notice-v1'] as const
export async function downloadData() {
  const localRecords = await exportLocalData()
  const preferences: Record<string, string> = {}
  for (const key of OWN_KEYS) {
    const value = localStorage.getItem(key)
    if (value !== null) preferences[key] = value
  }
  const blob = new Blob([JSON.stringify({ format: 'pilares-export-v1', exportedAt: new Date().toISOString(), indexedDB: localRecords, preferences }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `pilares-dados-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
  } finally { setTimeout(() => URL.revokeObjectURL(url), 60_000) }
}
export async function deleteData() {
  // Fail closed: if IndexedDB does not commit, do not claim that all data went away.
  await clearLocalData()
  const result = await disconnectLibrary()
  if (!result.localCleared) throw new Error('local connection cleanup not confirmed')
  for (const key of OWN_KEYS) localStorage.removeItem(key)
  localStorage.removeItem('pilares:gdrive:disconnect-signal')
}
