import { useEffect } from 'react'

/** Keep the document title in step with the page, restoring it on unmount. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
