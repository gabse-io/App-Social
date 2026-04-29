'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter, usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'
import { updatePassword, checkIsParent } from '@/lib/auth'
import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
}

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: 'fa-chart-line' },
  { label: 'Pedidos', href: '/admin/orders', icon: 'fa-shopping-cart' },
  { label: 'Campañas', href: '/admin/campaigns', icon: 'fa-folder-open' },
  { label: 'Entregas', href: '/admin/deliveries', icon: 'fa-truck' },
  { label: 'Padres', href: '/admin/parents', icon: 'fa-user-friends' },
  { label: 'Usuarios', href: '/admin/users', icon: 'fa-users-cog' },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [isAlsoParent, setIsAlsoParent] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loadTimeout, setLoadTimeout] = useState(false)

  useEffect(() => {
    const checkIfParent = async () => {
      if (profile?.email) {
        const parentExists = await checkIsParent(profile.email)
        setIsAlsoParent(parentExists)
      }
    }
    checkIfParent()
  }, [profile])

  // Timeout para evitar quedar colgado
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && loading) {
        setLoadTimeout(true)
      }
    }, 5000) // 5 segundos timeout

    return () => clearTimeout(timer)
  }, [user, loading])

  // Si hay timeout o no hay usuario después de cargar, redirigir al login
  useEffect(() => {
    if (loadTimeout && !user) {
      router.push('/login')
    }
  }, [loadTimeout, user, router])

  if (!user || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2edfc', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#5f7f9e', fontSize: '0.875rem' }}>
          {loadTimeout ? 'Redirigiendo al login...' : 'Cargando...'}
        </p>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setChangingPassword(true)

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      setChangingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      setChangingPassword(false)
      return
    }

    try {
      await updatePassword(newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
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
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="mobile-header-wrapper">
        <div className="mobile-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-basketball" style={{ color: 'white', fontSize: 18 }}></i>
            </div>
            <span style={{ fontWeight: 700, color: '#1e2f3e', fontSize: '1rem' }}>Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
          >
            <i className={mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
          </button>
        </div>
      </div>

      {/* Overlay para cerrar menú en mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 100
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: 260,
        background: '#fff',
        borderRight: '1px solid #e2edfc',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 101,
        transition: 'transform 0.3s ease'
      }}>
        {/* Logo / Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2edfc' }}>
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
              <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e2f3e', margin: 0 }}>Minibasquet</h1>
              <p style={{ fontSize: '0.75rem', color: '#5f7f9e', margin: 0 }}>Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 4,
                  textDecoration: 'none',
                  color: isActive ? '#1a73e8' : '#5f7f9e',
                  background: isActive ? '#e8f0fe' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
              >
                <i className={`fas ${item.icon}`} style={{ width: 20, textAlign: 'center' }}></i>
                {item.label}
              </Link>
            )
          })}

          {/* Divider */}
          <div style={{ height: 1, background: '#e2edfc', margin: '16px 0' }}></div>

          {/* Switch to Parent App - Solo si también es padre */}
          {isAlsoParent && (
            <button
              onClick={() => router.push('/app/new-order')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1.5px solid #e2edfc',
                background: 'white',
                color: '#059669',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d1fae5'
                e.currentTarget.style.borderColor = '#059669'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = '#e2edfc'
              }}
            >
              <i className="fas fa-exchange-alt" style={{ width: 20, textAlign: 'center' }}></i>
              Ir a App de Padres
            </button>
          )}
        </nav>

        {/* User Section */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2edfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a73e8, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              {profile.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1e2f3e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.name}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#5f7f9e' }}>Administrador</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: '1.5px solid #e2edfc',
              background: 'white',
              color: '#1a73e8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              marginBottom: 8
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
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: '1.5px solid #e2edfc',
              background: 'white',
              color: '#d46b5e',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
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
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e2f3e' }}>
              App Minibasquet Hindú Club
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#5f7f9e' }}>
              Gestión de recaudaciones y pedidos
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <Footer />
        </div>
      </main>

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
          zIndex: 1000
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e2f3e' }}>
                Cambiar Contraseña
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordError('')
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#5f7f9e',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {passwordSuccess && (
              <div style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-check-circle"></i>
                <span>Contraseña actualizada exitosamente</span>
              </div>
            )}

            {passwordError && (
              <div style={{
                background: '#ffe8e6',
                color: '#d46b5e',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#1e2f3e' }}>
                  Nueva contraseña
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
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1a73e8'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2edfc'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#1e2f3e' }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repite la nueva contraseña"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2edfc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1a73e8'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2edfc'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword || passwordSuccess}
                style={{
                  width: '100%',
                  background: changingPassword || passwordSuccess ? '#5f7f9e' : '#1a73e8',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'white',
                  cursor: changingPassword || passwordSuccess ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {changingPassword ? (
                  <>
                    <i className="fas fa-spinner fa-pulse"></i>
                    Cambiando...
                  </>
                ) : passwordSuccess ? (
                  <>
                    <i className="fas fa-check"></i>
                    Cambiada
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f0f4f8;
        }
        .mobile-header-wrapper {
          display: none;
        }
        .mobile-header-content {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: white;
          border-bottom: 1px solid #e2edfc;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 110;
        }
        .mobile-menu-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1.5px solid #e2edfc;
          background: white;
          color: #1a73e8;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-sidebar {
          width: 260px;
          background: #fff;
          border-right: 1px solid #e2edfc;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 101;
          transition: transform 0.3s ease;
        }
        .admin-main {
          flex: 1;
          margin-left: 260px;
          padding: 24px 32px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          .mobile-header-wrapper {
            display: block;
          }
          .admin-sidebar {
            transform: translateX(-100%);
            top: 60px;
            height: calc(100vh - 60px);
            box-shadow: none;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          }
          .admin-main {
            margin-left: 0;
            padding: 80px 16px 24px 16px;
          }
        }
      `}</style>
    </div>
  )
}
