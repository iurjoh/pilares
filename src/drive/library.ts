// Persistent library selection (localStorage) + Drive listing (drive.file scope: limited to authorized files, not a read-only scope).
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

const FOLDER_MIME = 'application/vnd.google-apps.folder'
export const MAX_LIBRARY_FILES = 1000
const MAX_DEPTH = 8
const MAX_FOLDERS = 300

interface DriveItem { id: string; name: string; mimeType: string }

async function listChildren(token: string, folderId: string): Promise<DriveItem[]> {
  const items: DriveItem[] = []
  let pageToken = ''
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and (mimeType='application/pdf' or mimeType='${FOLDER_MIME}') and trashed=false`)
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType)&orderBy=name&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      if (resp.status === 401) throw new Error('token-expired')
      throw new Error(`drive list failed: ${resp.status}`)
    }
    const data = await resp.json()
    for (const item of data.files ?? []) {
      if (item && typeof item.mimeType === 'string' && validId(item.id) && validName(item.name)) items.push(item)
    }
    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : ''
  } while (pageToken && items.length < MAX_LIBRARY_FILES * 2)
  return items
}

// Lists PDFs in the chosen folder and in all its subfolders (breadth-first).
// Files from subfolders are named "Subfolder / Book.pdf" so equal titles stay distinguishable.
// Bounded by depth, folder count and file count so a huge Drive cannot hang the page.
export async function listFolderPdfs(token: string, folderId: string): Promise<LibraryFile[]> {
  const files: LibraryFile[] = []
  const seen = new Set<string>([folderId])
  let level: { id: string; path: string }[] = [{ id: folderId, path: '' }]
  let folderCount = 0
  for (let depth = 0; level.length > 0 && depth <= MAX_DEPTH; depth++) {
    const next: { id: string; path: string }[] = []
    for (const folder of level) {
      if (++folderCount > MAX_FOLDERS) break
      const children = await listChildren(token, folder.id)
      for (const item of children) {
        if (item.mimeType === FOLDER_MIME) {
          if (!seen.has(item.id)) { seen.add(item.id); next.push({ id: item.id, path: `${folder.path}${item.name} / ` }) }
        } else if (files.length < MAX_LIBRARY_FILES && !files.some(f => f.id === item.id)) {
          files.push({ id: item.id, name: `${folder.path}${item.name}`.slice(0, 1000) })
        }
      }
      if (files.length >= MAX_LIBRARY_FILES) break
    }
    level = next
    if (files.length >= MAX_LIBRARY_FILES) break
  }
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
  const selection = validateSelection({ kind: 'files', files })
  if (!selection || selection.kind !== 'files') throw new Error('Invalid Drive response')
  return selection.files
}

export const previewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`
