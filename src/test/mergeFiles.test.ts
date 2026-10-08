import { describe, expect, it } from 'vitest'
import { MAX_LIBRARY_FILES, mergeFiles, removeFile } from '../drive/library'

const f = (id: string) => ({ id, name: `${id}.pdf` })

describe('mergeFiles', () => {
  it('adds new PDFs and skips ids already in the list', () => {
    const r = mergeFiles([f('a'), f('b')], [f('b'), f('c'), f('d')])
    expect(r.files.map(x => x.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(r.added).toBe(2)
    expect(r.truncated).toBe(false)
  })
  it('ignores items with invalid ids or names', () => {
    const r = mergeFiles([], [{ id: "x' or '1'='1", name: 'a.pdf' }, { id: 'ok', name: '  ' }, f('fine')])
    expect(r.files.map(x => x.id)).toEqual(['fine'])
  })
  it('stops at the limit and reports truncation', () => {
    const current = Array.from({ length: MAX_LIBRARY_FILES - 1 }, (_, i) => f(`id${i}`))
    const r = mergeFiles(current, [f('n1'), f('n2')])
    expect(r.files.length).toBe(MAX_LIBRARY_FILES)
    expect(r.added).toBe(1)
    expect(r.truncated).toBe(true)
  })
  it('does not mutate the input list', () => {
    const current = [f('a')]
    mergeFiles(current, [f('b')])
    expect(current).toEqual([f('a')])
  })
})

describe('removeFile', () => {
  it('removes only the given id', () => {
    expect(removeFile([f('a'), f('b')], 'a')).toEqual([f('b')])
    expect(removeFile([f('a')], 'zzz')).toEqual([f('a')])
  })
})
