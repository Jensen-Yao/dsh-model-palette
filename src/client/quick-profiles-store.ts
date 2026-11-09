/** Synchronize named shortcuts between composer seats and browser tabs. */
import { useCallback, useEffect, useState } from 'react'
import { parseQuickProfiles, type QuickProfile } from './quick-profiles.ts'

const STORAGE_KEY = 'dsh-model-palette:quick-profiles:v1'
const UPDATED_EVENT = 'dsh-model-palette:quick-profiles-updated'

function read(): QuickProfile[] {
  try {
    return parseQuickProfiles(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    // Missing storage access or malformed browser JSON yields an empty shortcut list.
    return []
  }
}

/**
 * Subscribe to named selections stored on this browser origin.
 * @returns Shortcuts and a write function that throws when browser storage refuses the write.
 */
export function useQuickProfiles(): [QuickProfile[], (next: QuickProfile[]) => void] {
  const [profiles, setProfiles] = useState(read)
  useEffect(() => {
    const reload = () => setProfiles(read())
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) reload()
    }
    window.addEventListener(UPDATED_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(UPDATED_EVENT, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  const update = useCallback((next: QuickProfile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      throw new Error('quick.storageFailed')
    }
    setProfiles(next)
    window.dispatchEvent(new Event(UPDATED_EVENT))
  }, [])
  return [profiles, update]
}
