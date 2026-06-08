import { useEffect, useRef } from 'react'

/**
 * Calls the provided function immediately and then every `interval` ms.
 * Stops polling when the component unmounts.
 *
 * Usage:
 * usePolling(load, 30000) // refresh every 30 seconds
 */
export const usePolling = (fn: () => void, interval = 30000) => {
  const savedFn = useRef(fn)

  // always call the latest version of fn
  useEffect(() => {
    savedFn.current = fn
  }, [fn])

  useEffect(() => {
    // call immediately on mount
    savedFn.current()

    const id = setInterval(() => {
      savedFn.current()
    }, interval)

    return () => clearInterval(id)
  }, [interval])
}