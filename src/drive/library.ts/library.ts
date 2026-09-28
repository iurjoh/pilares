// Persistent library selection (localStorage) + read-only Drive listing.
export interface LibraryFile { id: string; name: string }
export type LibrarySelection =
  | { kind: 'folder'; id: string; name: string }
  | { kind: 'files'; files: LibraryFile[] }

const KEY = 'pilares:library'

export function loadSelection(): LibrarySelection | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.kind === 'folder' && typeof parsed.id === 'string') return parsed
    if (parsed && parsed.kind === 'files' && Array.isArray(parsed.files)) return parsed
    return null
  } catch { return null }
}

export function saveSelection(sel: LibrarySelection) {
  try { localStorage.setItem(KEY, JSON.stringify(sel)) } catch { /* storage unavailable */ }
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
  return (data.files || []).map((f: any) => ({ id: f.id, name: f.name }))
}

export const previewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`
