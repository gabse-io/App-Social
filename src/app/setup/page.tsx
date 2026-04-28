'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SetupPage() {
  const [email, setEmail] = useState('montenegrogabriel90@gmail.com')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Intentar crear usuario
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        // Si el usuario ya existe, intentar signIn para verificar
        if (error.message.includes('already registered')) {
          setMessage('Usuario ya existe. Intentando actualizar contraseña...')
          
          // Crear un endpoint para reset de contraseña
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
          if (resetError) {
            setMessage('Error: ' + resetError.message)
          } else {
            setMessage('Email de recuperación enviado. Revisa tu correo.')
          }
        } else {
          setMessage('Error: ' + error.message)
        }
      } else {
        setMessage('Usuario creado exitosamente! Ahora puedes hacer login.')
      }
    } catch (err: any) {
      setMessage('Error inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) {
      setMessage('Error enviando email: ' + error.message)
    } else {
      setMessage('Email de recuperación enviado a ' + email)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '48px',
        padding: '40px 32px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#1e2f3e' }}>
          Configuración Admin
        </h1>

        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            background: message.includes('Error') ? '#ffe8e6' : '#e6f4ea',
            color: message.includes('Error') ? '#d46b5e' : '#2e7d32'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSetup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#5f7f9e' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid #e2edfc',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#5f7f9e' }}>
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 caracteres"
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid #e2edfc',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '40px',
              border: 'none',
              background: '#1a73e8',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: password.length >= 6 ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Procesando...' : 'Crear / Actualizar Usuario'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={handleResetPassword}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1a73e8',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Enviar email de recuperación
          </button>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fbfe', borderRadius: '12px', fontSize: '0.85rem', color: '#5f7f9e' }}>
          <strong>Opciones:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Si el usuario no existe, se creará</li>
            <li>Si ya existe, usa "Enviar email de recuperación"</li>
            <li>Revisa tu bandeja de entrada (y spam)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
