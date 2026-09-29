import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed'
// Queue saves in click order. A failed save is never described as saved; the
// last unsaved state remains on screen so it can be retried rather than lost.
export function usePillarSave<T>(saveToStore: (next: T) => Promise<void>, setState: Dispatch<SetStateAction<T | null>>) {
  const queue = useRef(Promise.resolve())
  const [status, setStatus] = useState<SaveStatus>('idle')
  const latest = useRef<T | null>(null)
  const generation = useRef(0)
  const save = useCallback((next: T) => {
    latest.current = next
    const version = ++generation.current
    setState(next)
    setStatus('saving')
    queue.current = queue.current.catch(() => {}).then(() => saveToStore(next)).then(() => {
      if (version === generation.current) setStatus('saved')
    }).catch(() => { if (version === generation.current) setStatus('failed') })
  }, [saveToStore, setState])
  const retry = useCallback(() => { if (latest.current !== null) save(latest.current) }, [save])
  return { save, retry, status }
}
