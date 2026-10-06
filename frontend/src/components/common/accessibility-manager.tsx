import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function AccessibilityManager() {
  const location = useLocation()

  useEffect(() => {
    const main = document.querySelector('main')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.setAttribute('role', 'main')
    }
  }, [location])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const active = document.activeElement as HTMLElement
        if (active) {
          active.blur()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return null
}
