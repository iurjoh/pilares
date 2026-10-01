// Persistent library selection (localStorage) + read-only Drive listing.
export interface LibraryFile { id: string; name: string }
export type LibrarySelection =
  | { kind: 'folder'; id: string; name: string }
  | { kind: 'files'; files: LibraryFile[] }

const KEY = 'pilares:library'

const validId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(value)
const validName = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000
export function validateSelection(value: unknown): LibrarySelection | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as Record<string, unknown>
  if (parsed.kind === 'folder' && validId(parsed.id) && validName(parsed.name)) {
    return { kind: 'folder', id: parsed.id, name: parsed.name }
  }
  if (parsed.kind === 'files' && Array.isArray(parsed.files) && parsed.files.length <= 1000) {
    const files: LibraryFile[] = []
    for (const item of parsed.files) {
      if (!item || typeof item !== 'object' || !validId(item.id) || !validName(item.name)) return null
      if (!files.some(file => file.id === item.id)) files.push({ id: item.id, name: item.name })
    }
    return { kind: 'files', files }
  }
  return null
}
let resetInvalidSelection = false
export function selectionWasReset(): boolean { return resetInvalidSelection }
export function loadSelection(): LibrarySelection | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const selection = validateSelection(JSON.parse(raw))
    if (selection) return selection
    resetInvalidSelection = true
    clearSelection()
    return null
  } catch {
    resetInvalidSelection = true
    clearSelection()
    return null
  }
}

export function saveSelection(sel: LibrarySelection) {
  const valid = validateSelection(sel)
  if (!valid) throw new Error('Invalid library selection')
  try { localStorage.setItem(KEY, JSON.stringify(valid)); resetInvalidSelection = false } catch { /* storage unavailable */ }
}

export function clearSelection() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export async function listFolderPdfs(token: string, folderId: string): Promise<LibraryFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and mimeType='application/pdf' and trashed=false`)
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=name&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true`
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('token-expired')
    throw new Error(`drive list failed: ${resp.status}`)
  }
  const data = await resp.json()
  const selection = validateSelection({ kind: 'files', files: data.files ?? [] })
  if (!selection || selection.kind !== 'files') throw new Error('Invalid Drive response')
  return selection.files
}

export const previewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`
