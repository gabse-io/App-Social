'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/lib/auth'
import { Footer } from '@/components/footer'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación')
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
              <i className="fas fa-check" style={{ fontSize: '32px', color: 'white' }}></i>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e2f3e',
              marginBottom: '12px'
            }}>
              Correo enviado
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#5f7f9e', marginBottom: '24px' }}>
              Hemos enviado un correo a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
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
              Volver al login
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
              <i className="fas fa-key" style={{ fontSize: '32px', color: 'white' }}></i>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e2f3e',
              marginBottom: '8px'
            }}>
              ¿Olvidaste tu contraseña?
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>
              Ingresa tu correo electrónico y te enviaremos instrucciones
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
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fbfe',
                border: '1.5px solid #e2edfc',
                borderRadius: '28px',
                padding: '4px 20px 4px 16px'
              }}>
                <i className="fas fa-envelope" style={{ color: '#8aadc9', fontSize: '1.1rem', width: '32px', textAlign: 'center' }}></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Correo electrónico"
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
                  Enviando...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Enviar instrucciones
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
