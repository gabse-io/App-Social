'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { signIn, isParentActive, signOut, getCurrentProfile } from '@/lib/auth'
import { Footer } from '@/components/footer'

// Hook to safely read URL params on client only
function useClientErrorParam() {
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const errorParam = searchParams.get('error')
    if (errorParam === 'inactive') {
      setMessage('Tu cuenta ha sido desactivada. Contacta al administrador.')
    }
  }, [searchParams])

  return mounted ? message : ''
}

// Component that uses useSearchParams - must be wrapped in a Suspense boundary
function ErrorBanner() {
  const message = useClientErrorParam()

  if (!message) return null

  return (
    <div style={{
      background: '#ffe8e6',
      color: '#d46b5e',
      padding: '12px 16px',
      borderRadius: '28px',
      fontSize: '0.75rem',
      fontWeight: 500,
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderLeft: '4px solid #d46b5e'
    }}>
      <i className="fas fa-exclamation-circle"></i>
      <span>{message}</span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/app/new-order')
      }
    }
  }, [user, profile, router])

  if (user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e2edfc', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      await signIn(email, password)

      // Verificar si es padre y si está activo
      const profile = await getCurrentProfile()
      if (profile?.role === 'parent') {
        const isActive = await isParentActive(email)
        if (!isActive) {
          // Cerrar sesión si el padre está inactivo
          await signOut()
          setFormError('Tu cuenta ha sido desactivada. Contacta al administrador.')
          setIsSubmitting(false)
          return
        }
      }

      // El useEffect se encargará de redirigir según el rol
    } catch (err: any) {
      setFormError(err.message || 'Error en la autenticación')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card {
          animation: fadeInUp 0.4s ease-out;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 32px 20px !important;
            border-radius: 32px !important;
          }
          .login-card h1 {
            font-size: 1.4rem !important;
          }
          .login-card p {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      
      <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto' }}>
        <div className="login-card" style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(2px)',
          borderRadius: '48px',
          padding: '40px 32px',
          boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
              width: '64px',
              height: '64px',
              borderRadius: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 10px 20px -5px rgba(26,115,232,0.3)'
            }}>
              <i className="fas fa-basketball" style={{ fontSize: '32px', color: 'white' }}></i>
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e2f3e, #1a73e8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '6px'
            }}>
              App Minibasquet Hindú Club
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5f7f9e', fontWeight: 500 }}>
              Acceso exclusivo para padres y apoderados
            </p>
          </div>

          <Suspense fallback={<div style={{ display: 'none' }}></div>}>
            <ErrorBanner />
          </Suspense>

          {formError && (
            <div style={{
              background: '#ffe8e6',
              color: '#d46b5e',
              padding: '12px 16px',
              borderRadius: '28px',
              fontSize: '0.75rem',
              fontWeight: 500,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderLeft: '4px solid #d46b5e'
            }}>
              <i className="fas fa-exclamation-circle"></i>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fbfe',
                border: '1.5px solid #e2edfc',
                borderRadius: '28px',
                padding: '4px 20px 4px 16px',
                transition: 'all 0.2s ease'
              }} className="input-wrapper">
                <i className="fas fa-envelope" style={{ color: '#8aadc9', fontSize: '1.1rem', width: '32px', textAlign: 'center' }}></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Correo electrónico"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '14px 0',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#1e2f3e',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fbfe',
                border: '1.5px solid #e2edfc',
                borderRadius: '28px',
                padding: '4px 20px 4px 16px',
                transition: 'all 0.2s ease'
              }} className="input-wrapper">
                <i className="fas fa-lock" style={{ color: '#8aadc9', fontSize: '1.1rem', width: '32px', textAlign: 'center' }}></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '14px 0',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#1e2f3e',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: '#1a73e8',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '40px',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '8px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(26,115,232,0.25)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-pulse"></i>
                  Ingresando...
                </>
              ) : (
                <>
                  <i className="fas fa-arrow-right-to-bracket"></i>
                  Ingresar
                </>
              )}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#7d9bc0',
            borderTop: '1px solid #eef3fc',
            paddingTop: '20px',
            marginTop: '8px'
          }}>
            <a href="/forgot-password" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>
              <i className="fas fa-question-circle" style={{ marginRight: '4px' }}></i>
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <Footer />
        </div>
      </div>
    </div>
  )
}
