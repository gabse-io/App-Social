'use client'

import { useAuth } from '@/components/providers'
import { useRouter, usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { isParentActive, isAdminUser, updatePassword } from '@/lib/auth'

interface ParentLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Nuevo Pedido', href: '/app/new-order', icon: 'fa-plus-circle' },
  { label: 'Mis Pedidos', href: '/app/my-orders', icon: 'fa-clipboard-list' },
]

export function ParentLayout({ children }: ParentLayoutProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [isAlsoAdmin, setIsAlsoAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Estados para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const checkParentStatus = async () => {
      if (profile?.role === 'parent' && profile?.email) {
        const active = await isParentActive(profile.email)
        setIsActive(active)
        if (!active) {
          await signOut()
          router.push('/login?error=inactive')
        }
      }
      setIsChecking(false)
    }

    const checkIfAdmin = async () => {
      if (profile?.email) {
        const adminExists = await isAdminUser(profile.email)
        setIsAlsoAdmin(adminExists)
      }
    }

    if (profile) {
      checkParentStatus()
      checkIfAdmin()
    } else if (!user) {
      // No hay usuario, dejar de chequear
      setIsChecking(false)
    }
  }, [profile, user, router, signOut])

  // Timeout de seguridad con flag de montaje
  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsChecking(false)
      }
    }, 6000)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [user, profile])

  if (!user || !profile || isChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2edfc', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  if (!isActive) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setChangingPassword(true)

    try {
      await updatePassword(newPassword)
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (error: any) {
      setPasswordError(error.message || 'Error al cambiar la contraseña')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Header */}
      <header className="parent-header">
        <div className="parent-header-content">
          {/* Logo - siempre visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-basketball" style={{ color: 'white', fontSize: 20 }}></i>
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e2f3e', margin: 0 }}>App Minibasquet</h1>
              <p style={{ fontSize: '0.75rem', color: '#5f7f9e', margin: 0 }}>Hindú Club</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="parent-nav-desktop">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: isActive ? '#1a73e8' : '#5f7f9e',
                    background: isActive ? '#e8f0fe' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className={`fas ${item.icon}`}></i>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="parent-actions-desktop">
            {/* Switch to Admin Button - Solo si también es admin */}
            {isAlsoAdmin && (
              <button
                onClick={() => router.push('/admin')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #e2edfc',
                  background: 'white',
                  color: '#1a73e8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e8f0fe'
                  e.currentTarget.style.borderColor = '#1a73e8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#e2edfc'
                }}
              >
                <i className="fas fa-user-shield"></i>
                Ir a Admin
              </button>
            )}

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1e2f3e' }}>{profile.name}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#5f7f9e' }}>Padre/Apoderado</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1.5px solid #e2edfc',
                background: 'white',
                color: '#1a73e8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e8f0fe'
                e.currentTarget.style.borderColor = '#1a73e8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = '#e2edfc'
              }}
            >
              <i className="fas fa-key"></i>
              Cambiar Contraseña
            </button>
            <button
              onClick={handleSignOut}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1.5px solid #e2edfc',
                background: 'white',
                color: '#d46b5e',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffe8e6'
                e.currentTarget.style.borderColor = '#d46b5e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = '#e2edfc'
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              Salir
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="parent-mobile-menu-btn"
          >
            <i className={mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="parent-mobile-menu">
            {/* Nav Items Mobile */}
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: isActive ? '#1a73e8' : '#5f7f9e',
                    background: isActive ? '#e8f0fe' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className={`fas ${item.icon}`} style={{ width: 24, textAlign: 'center' }}></i>
                  {item.label}
                </Link>
              )
            })}

            {/* Divider */}
            <div style={{ height: 1, background: '#e2edfc', margin: '8px 0' }}></div>

            {/* Admin Switch Mobile */}
            {isAlsoAdmin && (
              <button
                onClick={() => { setMobileMenuOpen(false); router.push('/admin') }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'transparent',
                  color: '#059669',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <i className="fas fa-user-shield" style={{ width: 24, textAlign: 'center' }}></i>
                Ir a Admin
              </button>
            )}

            {/* User Info Mobile */}
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e2f3e' }}>{profile.name}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#5f7f9e' }}>Padre/Apoderado</p>
            </div>

            {/* Change Password Mobile */}
            <button
              onClick={() => { setMobileMenuOpen(false); setShowPasswordModal(true) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: '#1a73e8',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <i className="fas fa-key" style={{ width: 24, textAlign: 'center' }}></i>
              Cambiar Contraseña
            </button>

            {/* Sign Out Mobile */}
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: '#d46b5e',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <i className="fas fa-sign-out-alt" style={{ width: 24, textAlign: 'center' }}></i>
              Cerrar Sesión
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="parent-main">
        {children}
      </main>

      {/* Footer */}
      <div className="parent-footer">
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .parent-header {
          background: white;
          border-bottom: 1px solid #e2edfc;
          padding: 12px 16px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .parent-header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .parent-nav-desktop {
          display: flex;
          gap: 8px;
        }
        .parent-actions-desktop {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .parent-mobile-menu-btn {
          display: none;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1.5px solid #e2edfc;
          background: white;
          color: #1a73e8;
          font-size: 1.2rem;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }
        .parent-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          padding: 12px 0;
          border-top: 1px solid #e2edfc;
        }
        .parent-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .parent-footer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 24px;
        }
        @media (max-width: 768px) {
          .parent-nav-desktop,
          .parent-actions-desktop {
            display: none;
          }
          .parent-mobile-menu-btn {
            display: flex;
          }
          .parent-main {
            padding: 16px;
          }
          .parent-footer {
            padding: 0 16px 16px;
          }
        }
      `}</style>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
                width: '56px',
                height: '56px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <i className="fas fa-key" style={{ fontSize: '24px', color: 'white' }}></i>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2f3e', margin: 0 }}>
                Cambiar Contraseña
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#5f7f9e', margin: '8px 0 0 0' }}>
                Ingresa tu nueva contraseña
              </p>
            </div>

            {passwordSuccess ? (
              <div style={{
                background: '#e6f4ea',
                color: '#1e8e3e',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                <p style={{ margin: 0, fontWeight: 600 }}>Contraseña actualizada correctamente</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange}>
                {passwordError && (
                  <div style={{
                    background: '#fce8e8',
                    color: '#d93025',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    marginBottom: '16px'
                  }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                    {passwordError}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e2f3e', marginBottom: '6px' }}>
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2edfc',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e2f3e', marginBottom: '6px' }}>
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Repite la contraseña"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2edfc',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={changingPassword}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2edfc',
                      background: 'white',
                      color: '#5f7f9e',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#1a73e8',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: changingPassword ? 0.7 : 1
                    }}
                  >
                    {changingPassword ? (
                      <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Guardando...</>
                    ) : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
