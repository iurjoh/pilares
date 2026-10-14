import { describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { usePillarSave } from '../lib/usePillarSave'

function setup(saveToStore: (n: number) => Promise<void>) {
  return renderHook(() => {
    const [value, setValue] = useState<number | null>(null)
    return { value, ...usePillarSave<number>(saveToStore, setValue) }
  })
}

describe('usePillarSave', () => {
  it('reports saving then saved only after the store resolves', async () => {
    let release: (() => void) | undefined
    const { result } = setup(() => new Promise<void>(r => { release = r }))
    act(() => result.current.save(1))
    expect(result.current.status).toBe('saving')
    expect(result.current.value).toBe(1)
    await waitFor(() => expect(release).toBeDefined())
    await act(async () => { release?.() })
    await waitFor(() => expect(result.current.status).toBe('saved'))
  })
  it('never claims saved after a failure and retries the last state', async () => {
    let fail = true
    const calls: number[] = []
    const { result } = setup(async n => { calls.push(n); if (fail) throw new Error('quota') })
    act(() => result.current.save(5))
    await waitFor(() => expect(result.current.status).toBe('failed'))
    fail = false
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('saved'))
    expect(calls).toEqual([5, 5])
  })
  it('starts storage writes synchronously in click order; storage owns commit ordering', async () => {
    const order: number[] = []
    const { result } = setup(async n => { order.push(n); await new Promise(r => setTimeout(r, n === 1 ? 20 : 0)) })
    act(() => { result.current.save(1); result.current.save(2) })
    await waitFor(() => expect(result.current.status).toBe('saved'))
    expect(order).toEqual([1, 2])
  })
})
