'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updatePassword } from '@/lib/auth'
import { Footer } from '@/components/footer'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setError('Enlace inválido o expirado')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
        <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(2px)',
            borderRadius: '48px',
            padding: '40px 32px',
            boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
              width: '64px',
              height: '64px',
              borderRadius: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <i className="fas fa-check-circle" style={{ fontSize: '32px', color: 'white' }}></i>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e2f3e',
              marginBottom: '12px'
            }}>
              Contraseña actualizada
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#5f7f9e', marginBottom: '24px' }}>
              Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: '#1a73e8',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '40px',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Ir al login
            </button>
          </div>
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
            <Footer />
          </div>
        </div>
      </div>
    )
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
      <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(2px)',
          borderRadius: '48px',
          padding: '40px 32px',
          boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.2)'
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
              marginBottom: '20px'
            }}>
              <i className="fas fa-lock" style={{ fontSize: '32px', color: 'white' }}></i>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e2f3e',
              marginBottom: '8px'
            }}>
              Nueva contraseña
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>
              Ingresa tu nueva contraseña
            </p>
          </div>

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fbfe',
                border: '1.5px solid #e2edfc',
                borderRadius: '28px',
                padding: '4px 20px 4px 16px'
              }}>
                <i className="fas fa-lock" style={{ color: '#8aadc9', fontSize: '1.1rem', width: '32px', textAlign: 'center' }}></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Nueva contraseña"
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
                padding: '4px 20px 4px 16px'
              }}>
                <i className="fas fa-lock" style={{ color: '#8aadc9', fontSize: '1.1rem', width: '32px', textAlign: 'center' }}></i>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirmar contraseña"
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
              disabled={loading}
              style={{
                width: '100%',
                background: '#1a73e8',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '40px',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-pulse"></i>
                  Actualizando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Actualizar contraseña
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
            marginTop: '24px'
          }}>
            <a href="/login" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: '4px' }}></i>
              Volver al login
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '48px', 
          padding: '40px 32px',
          boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fas fa-spinner fa-pulse" style={{ fontSize: '32px', color: '#1a73e8' }}></i>
            <p style={{ marginTop: '16px', color: '#5f7f9e' }}>Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
