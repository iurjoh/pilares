import { describe, expect, it } from 'vitest'
import { EN } from '../i18n/en'
import { BOOKS, READING_PLAN_365, translateReference } from '../spiritual/plan'

const en = (s: string) => EN[s] ?? s

describe('translateReference', () => {
  it('traduz o livro e preserva capítulos', () => {
    expect(translateReference('Gênesis 1–3', en)).toBe('Genesis 1–3')
    expect(translateReference('1 Samuel 4', en)).toBe('1 Samuel 4')
    expect(translateReference('Salmos 23', en)).toBe('Psalms 23')
  })
  it('mantém o texto quando não reconhece o formato', () => {
    expect(translateReference('texto livre', en)).toBe('texto livre')
  })
  it('todo livro do plano tem tradução EN', () => {
    const missing = BOOKS.map(([name]) => name).filter(name => !(name in EN))
    expect(missing).toEqual([])
  })
  it('nenhuma referência do plano fica em português no EN', () => {
    const bad = READING_PLAN_365.flatMap(r => r.references).filter(ref => /Gênesis|Êxodo|Salmos/.test(translateReference(ref, en)))
    expect(bad).toEqual([])
  })
})
