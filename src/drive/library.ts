// Persistent library selection (localStorage). Scope drive.file only reaches files the user picked in the Google Picker; folder contents are not granted, so the library is a list of picked PDFs.
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

export const MAX_LIBRARY_FILES = 1000

export interface MergeResult { files: LibraryFile[]; added: number; truncated: boolean }

// Adds newly picked PDFs to the saved list, skipping ids already there and respecting the size limit.
export function mergeFiles(current: LibraryFile[], picked: LibraryFile[]): MergeResult {
  const files = [...current]
  let added = 0
  let truncated = false
  for (const item of picked) {
    if (!validId(item.id) || !validName(item.name) || files.some(file => file.id === item.id)) continue
    if (files.length >= MAX_LIBRARY_FILES) { truncated = true; break }
    files.push({ id: item.id, name: item.name })
    added += 1
  }
  return { files, added, truncated }
}

export const removeFile = (files: LibraryFile[], id: string): LibraryFile[] => files.filter(file => file.id !== id)

export const previewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`
