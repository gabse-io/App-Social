'use client'

import { useEffect, useState } from 'react'

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // En SSR: retornar null para evitar hydration mismatch
  // En cliente inicial: retornar null mientras se monta
  // En cliente montado: retornar children
  if (!isClient) {
    return null
  }

  return <>{children}</>
}
