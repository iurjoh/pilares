import { afterEach, describe, expect, it, vi } from 'vitest'
import { listFolder } from '../drive/library'

const F = 'application/vnd.google-apps.folder'
const P = 'application/pdf'
type Item = { id: string; name: string; mimeType: string }
// Synthetic tree: root -> [Filosofia(folder) -> [Livro A.pdf], Solto.pdf]
const tree: Record<string, Item[]> = {
  root: [{ id: 'filo', name: 'Filosofia', mimeType: F }, { id: 'solto', name: 'Solto.pdf', mimeType: P }],
  filo: [{ id: 'a', name: 'Livro 10.pdf', mimeType: P }, { id: 'a2', name: 'Livro 2.pdf', mimeType: P }],
}
function mockDrive(pages?: Record<string, Item[][]>) {
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url)
    const parent = /'([^']+)' in parents/.exec(decodeURIComponent(u.searchParams.get('q') ?? ''))![1]
    calls.push(parent)
    const idx = Number(u.searchParams.get('pageToken') ?? 0)
    const paged = pages?.[parent]
    const files = paged ? paged[idx] : (tree[parent] ?? [])
    const nextPageToken = paged && idx + 1 < paged.length ? String(idx + 1) : undefined
    return { ok: true, status: 200, json: async () => ({ files, nextPageToken }) } as Response
  }))
  return calls
}
afterEach(() => vi.unstubAllGlobals())

describe('listFolder', () => {
  it('separates subfolders from PDFs for one level only', async () => {
    const calls = mockDrive()
    const r = await listFolder('tok', 'root')
    expect(r.folders).toEqual([{ id: 'filo', name: 'Filosofia' }])
    expect(r.files).toEqual([{ id: 'solto', name: 'Solto.pdf' }])
    expect(calls).toEqual(['root'])
  })
  it('sorts names naturally (2 before 10)', async () => {
    mockDrive()
    expect((await listFolder('tok', 'filo')).files.map(f => f.name)).toEqual(['Livro 2.pdf', 'Livro 10.pdf'])
  })
  it('follows nextPageToken', async () => {
    mockDrive({ root: [[{ id: 'p1', name: 'P1.pdf', mimeType: P }], [{ id: 'p2', name: 'P2.pdf', mimeType: P }]] })
    expect((await listFolder('tok', 'root')).files.map(f => f.id)).toEqual(['p1', 'p2'])
  })
  it('rejects ids with unsafe characters before any request', async () => {
    const calls = mockDrive()
    await expect(listFolder('tok', "x' or '1'='1")).rejects.toThrow('Invalid folder id')
    expect(calls).toEqual([])
  })
  it('turns 401 into token-expired', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }) as Response))
    await expect(listFolder('tok', 'root')).rejects.toThrow('token-expired')
  })
})
