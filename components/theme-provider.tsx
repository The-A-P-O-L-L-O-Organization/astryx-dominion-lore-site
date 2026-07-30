'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!document.body.getAttribute('data-theme')) {
      document.body.setAttribute('data-theme', 'sci-fi')
    }
  }, [])

  return <>{children}</>
}
