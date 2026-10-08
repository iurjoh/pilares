import { beforeEach, describe, expect, it } from 'vitest'
import { clearLocalData, exportLocalData, localStore } from '../lib/store'
import { loadFinancial } from '../financial-state'
import { loadSpiritual } from '../spiritual/state'

beforeEach(async () => { await clearLocalData() })

describe('localStore', () => {
  it('persists and reads back a value after the transaction commits', async () => {
    await localStore.set('k', { a: 1 })
    expect(await localStore.get('k')).toEqual({ a: 1 })
  })
  it('returns undefined for missing keys', async () => {
    expect(await localStore.get('missing')).toBeUndefined()
  })
  it('exports only string keys and clears everything', async () => {
    await localStore.set('one', 1)
    await localStore.set('two', 2)
    expect(await exportLocalData()).toEqual({ one: 1, two: 2 })
    await clearLocalData()
    expect(await exportLocalData()).toEqual({})
  })
})

describe('state loaders defend against corrupt data', () => {
  it('financial: wrong version falls back to defaults', async () => {
    await localStore.set('financeiro-v1', { version: 99, months: 'x' })
    const s = await loadFinancial()
    expect(s.version).toBe(1)
    expect(s.months).toEqual({})
  })
  it('financial: drops invalid months and over-long notes', async () => {
    await localStore.set('financeiro-v1', { version: 1, titheEnabled: false, investorOsLinked: false, investGoalText: '', investGoalDone: false, investGoalHistory: [],
      months: { '2026-13': { goal: 'x' }, '2026-05': { goal: 'y'.repeat(500), titheNote: 'ok' } } })
    const s = await loadFinancial()
    expect(Object.keys(s.months)).toEqual(['2026-05'])
    expect(s.months['2026-05'].goal).toBeUndefined()
    expect(s.months['2026-05'].titheNote).toBe('ok')
  })
  it('spiritual: keeps only valid, unique day numbers', async () => {
    await localStore.set('spiritual-plan-v1', { version: 1, startDate: '2026-01-01', completedDays: [1, 1, 0, 366, 2.5, 7], weeks: null })
    const s = await loadSpiritual()
    expect(s.completedDays).toEqual([1, 7])
    expect(s.weeks).toEqual({})
  })
})
