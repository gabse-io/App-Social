'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'

export default function Home() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        // Redirigir según el rol
        if (profile.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/app/new-order')
        }
      } else if (!user) {
        router.push('/login')
      }
    }
  }, [user, profile, loading, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          border: '3px solid #e2edfc', 
          borderTop: '3px solid #1a73e8', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px auto'
        }}></div>
        <p style={{ color: '#5f7f9e' }}>Cargando...</p>
      </div>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
