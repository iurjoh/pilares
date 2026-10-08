import { beforeEach, describe, expect, it } from 'vitest'
import { loadSelection, saveSelection, selectionWasReset, validateSelection } from '../drive/library'

beforeEach(() => localStorage.clear())

describe('validateSelection', () => {
  it('accepts a valid folder', () => {
    expect(validateSelection({ kind: 'folder', id: 'abc_123-X', name: 'Livros' })).toEqual({ kind: 'folder', id: 'abc_123-X', name: 'Livros' })
  })
  it('rejects ids with injection characters', () => {
    expect(validateSelection({ kind: 'folder', id: "a' or '1'='1", name: 'x' })).toBeNull()
  })
  it('rejects oversized lists and de-duplicates ids', () => {
    const many = Array.from({ length: 1001 }, (_, i) => ({ id: `id${i}`, name: 'n' }))
    expect(validateSelection({ kind: 'files', files: many })).toBeNull()
    const dup = validateSelection({ kind: 'files', files: [{ id: 'a', name: 'n' }, { id: 'a', name: 'm' }] })
    expect(dup && dup.kind === 'files' && dup.files.length).toBe(1)
  })
  it('rejects non-objects and unknown kinds', () => {
    for (const bad of [null, 'x', 3, { kind: 'zip' }, { kind: 'files', files: [null] }]) expect(validateSelection(bad)).toBeNull()
  })
})

describe('selection persistence', () => {
  it('round-trips a valid selection', () => {
    saveSelection({ kind: 'files', files: [{ id: 'a', name: 'n.pdf' }] })
    expect(loadSelection()).toEqual({ kind: 'files', files: [{ id: 'a', name: 'n.pdf' }] })
  })
  it('clears corrupt storage and flags the reset', () => {
    localStorage.setItem('pilares:library', '{not json')
    expect(loadSelection()).toBeNull()
    expect(selectionWasReset()).toBe(true)
    expect(localStorage.getItem('pilares:library')).toBeNull()
  })
  it('refuses to save an invalid selection', () => {
    expect(() => saveSelection({ kind: 'folder', id: '!!', name: 'x' })).toThrow()
  })
})
