'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { getParents, createParent, updateParent, toggleParentStatus } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'

export default function ParentsPage() {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [parents, setParents] = useState<any[]>([])
  const [filteredParents, setFilteredParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedParent, setSelectedParent] = useState<any>(null)
  
  // Form state - Add
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [createdParentEmail, setCreatedParentEmail] = useState('')
  
  // Form state - Edit
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/login')
      return
    }
    loadData()
  }, [profile, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getParents()
      setParents(data)
      setFilteredParents(data)
    } catch (error) {
      console.error('Error loading parents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredParents(parents)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = parents.filter((parent: any) =>
        parent.name?.toLowerCase().includes(term) ||
        parent.email?.toLowerCase().includes(term) ||
        parent.phone?.toLowerCase().includes(term)
      )
      setFilteredParents(filtered)
    }
  }, [searchTerm, parents])

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      alert('Nombre y email son requeridos')
      return
    }

    setSubmitting(true)
    try {
      console.log('Creando padre via API...')
      
      // Usar API en lugar de signUp para evitar cambio de sesión
      const response = await fetch('/api/create-parent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear padre')
      }

      console.log('Padre creado exitosamente:', result)

      setCreatedParentEmail(newEmail)
      setCreateSuccess(true)
      loadData()
    } catch (error: any) {
      console.error('Error creating parent:', error)
      
      // Manejo específico de errores conocidos
      if (error.message?.includes('ya está registrado en el sistema pero no tiene perfil')) {
        alert('Error: Este email ya está registrado pero no tiene perfil asociado.\n\nSoluciones:\n1. Use un email diferente\n2. Contacte soporte para recuperar el usuario existente\n3. El administrador puede eliminar el usuario manualmente de Supabase Auth si es necesario')
      } else if (error.message?.includes('Rate limit') || error.message?.includes('rate limit')) {
        alert('Límite de creación de usuarios alcanzado.\n\nEsto ocurre porque Supabase tiene un límite por hora.\n\nSoluciones:\n1. Espere 30-60 minutos antes de intentar nuevamente\n2. Desactive "Confirm email" en Supabase Dashboard → Authentication → Email → Confirm email')
      } else if (error.message?.includes('new row violates row-level security policy')) {
        alert('Error de permisos: No tiene autorización para crear padres.\n\nSolución:\n1. Verifique que tiene rol de administrador\n2. Ejecute el SQL de políticas RLS en setup-database.sql\n3. Recargue la página')
      } else if (error.message?.includes('userId es null')) {
        alert('Error: No se pudo crear el usuario de autenticación.\n\nPosibles causas:\n1. El email ya existe en el sistema\n2. Hay un problema temporal con el servicio de autenticación\n3. El formato del email no es válido\n\nSolución: Intenta con un email diferente o contacta soporte.')
      } else {
        alert('Error al crear padre: ' + (error.message || 'Error desconocido'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (parent: any) => {
    const newStatus = !parent.is_active
    const action = newStatus ? 'activar' : 'desactivar'
    
    if (!confirm(`¿Estás seguro de ${action} a "${parent.name}"?`)) {
      return
    }

    try {
      await toggleParentStatus(parent.id, newStatus)
      loadData()
      alert(`Padre ${action}do correctamente`)
    } catch (error: any) {
      console.error('Error toggling parent status:', error)
      alert('Error al cambiar estado: ' + (error.message || 'Error desconocido'))
    }
  }

  const openEditModal = (parent: any) => {
    setSelectedParent(parent)
    setEditName(parent.name)
    setEditEmail(parent.email || '')
    setEditPhone(parent.phone || '')
    setShowEditForm(true)
  }

  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParent) return
    
    if (!editName.trim()) {
      alert('El nombre es requerido')
      return
    }

    setEditing(true)
    try {
      await updateParent(selectedParent.id, editName, editEmail, editPhone)
      setShowEditForm(false)
      setSelectedParent(null)
      setEditName('')
      setEditEmail('')
      setEditPhone('')
      loadData()
      alert('Padre actualizado correctamente')
    } catch (error: any) {
      console.error('Error updating parent:', error)
      alert('Error al actualizar: ' + (error.message || 'Error desconocido'))
    } finally {
      setEditing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e2edfc', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header moderno con glassmorphism */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: 32,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        padding: '16px 28px',
        borderRadius: 60,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <i className="fas fa-user-friends"></i>
            Gestión de Padres y Apoderados
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#5f7f9e', marginTop: 4, marginBottom: 0 }}>
            Crea y administra los padres que podrán tomar pedidos
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', width: '100%', maxWidth: 500 }}>
          {/* Buscador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            borderRadius: 40,
            padding: '8px 16px',
            border: '1.5px solid #e0edf9',
            gap: 8,
            flex: 1,
            minWidth: 200,
            maxWidth: '100%'
          }}>
            <i className="fas fa-search" style={{ color: '#8aadc9', fontSize: '0.9rem' }}></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                color: '#1e2f3e',
                width: '100%',
                minWidth: 120
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8aadc9',
                  padding: 0,
                  fontSize: '0.8rem'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: '#1a73e8',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 40,
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'white',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(26,115,232,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0e5fc9'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(26,115,232,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a73e8'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(26,115,232,0.2)'
            }}
          >
            <i className="fas fa-plus-circle"></i>
            {showAddForm ? 'Cancelar' : 'Nuevo Padre'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) {
          .parents-table th,
          .parents-table td {
            padding: 10px 8px !important;
            font-size: 0.8rem !important;
          }
          .parents-table th:nth-child(3),
          .parents-table td:nth-child(3) {
            display: none;
          }
        }
      `}</style>

      {/* Modal para crear padre */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddForm(false)}>
          <div style={{
            background: 'white',
            borderRadius: 40,
            maxWidth: 600,
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '28px 32px',
            boxShadow: '0 30px 50px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '2px solid #eef3fc'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e2f3e' }}>
                <i className="fas fa-user-plus" style={{ marginRight: 10, color: '#1a73e8' }}></i>
                Crear Nuevo Padre/Apoderado
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#8aadc9',
                  padding: 4
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {createSuccess ? (
              // Mensaje de éxito
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: '#e8f5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <i className="fas fa-check-circle" style={{ fontSize: 40, color: '#2e7d32' }}></i>
                </div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e2f3e' }}>
                  ¡Padre creado exitosamente!
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#5f7f9e' }}>
                  <strong>Email:</strong> {createdParentEmail}
                </p>
                <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', color: '#5f7f9e' }}>
                  <strong>Contraseña temporal:</strong> temporal123
                </p>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setCreateSuccess(false)
                    setNewName('')
                    setNewEmail('')
                    setNewPhone('')
                    setCreatedParentEmail('')
                  }}
                  style={{
                    background: '#1a73e8',
                    border: 'none',
                    color: 'white',
                    padding: '14px 32px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(26,115,232,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0e5fc9'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(26,115,232,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1a73e8'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(26,115,232,0.2)'
                  }}
                >
                  <i className="fas fa-check" style={{ marginRight: 8 }}></i>
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddParent}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#4a7c9c',
                      marginBottom: 6
                    }}>
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="Ej: Juan Pérez"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 24,
                        border: '1.5px solid #e0edf9',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1a73e8'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0edf9'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#4a7c9c',
                      marginBottom: 6
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      placeholder="ejemplo@email.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 24,
                        border: '1.5px solid #e0edf9',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1a73e8'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0edf9'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#4a7c9c',
                      marginBottom: 6
                    }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 24,
                        border: '1.5px solid #e0edf9',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1a73e8'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e0edf9'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 28,
                  paddingTop: 16,
                  borderTop: '1px solid #eef3fc'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #c2dcf5',
                      color: '#1a73e8',
                      padding: '12px 24px',
                      borderRadius: 40,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#eef5ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? '#5f7f9e' : '#1a73e8',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: 40,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 6px rgba(26,115,232,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.background = '#0e5fc9'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(26,115,232,0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.background = '#1a73e8'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(26,115,232,0.2)'
                      }
                    }}
                  >
                    <i className={submitting ? 'fas fa-spinner fa-pulse' : 'fas fa-save'}></i>
                    {submitting ? 'Creando...' : 'Crear Padre'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal para editar padre */}
      {showEditForm && selectedParent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => {
          setShowEditForm(false)
          setSelectedParent(null)
        }}>
          <div style={{
            background: 'white',
            borderRadius: 40,
            maxWidth: 600,
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '28px 32px',
            boxShadow: '0 30px 50px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '2px solid #eef3fc'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e2f3e' }}>
                <i className="fas fa-pen" style={{ marginRight: 10, color: '#1a73e8' }}></i>
                Editar Padre
              </h2>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setSelectedParent(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#8aadc9',
                  padding: 4
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditParent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#4a7c9c',
                    marginBottom: 6
                  }}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="Ej: Juan Pérez"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 24,
                      border: '1.5px solid #e0edf9',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1a73e8'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0edf9'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#4a7c9c',
                    marginBottom: 6
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="ejemplo@email.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 24,
                      border: '1.5px solid #e0edf9',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1a73e8'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0edf9'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#4a7c9c',
                    marginBottom: 6
                  }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 24,
                      border: '1.5px solid #e0edf9',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1a73e8'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0edf9'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 28,
                paddingTop: 16,
                borderTop: '1px solid #eef3fc'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setSelectedParent(null)
                  }}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #c2dcf5',
                    color: '#1a73e8',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eef5ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  style={{
                    background: editing ? '#5f7f9e' : '#1a73e8',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: editing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(26,115,232,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (!editing) {
                      e.currentTarget.style.background = '#0e5fc9'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(26,115,232,0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editing) {
                      e.currentTarget.style.background = '#1a73e8'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(26,115,232,0.2)'
                    }
                  }}
                >
                  <i className={editing ? 'fas fa-spinner fa-pulse' : 'fas fa-save'}></i>
                  {editing ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla moderna de padres */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #eef3fc', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        {parents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#8aadc9'
          }}>
            <i className="fas fa-users" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'block' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#5f7f9e' }}>No hay padres registrados</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Haz clic en "Nuevo Padre" para agregar el primero</p>
          </div>
        ) : filteredParents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#8aadc9'
          }}>
            <i className="fas fa-search" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'block' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#5f7f9e' }}>No se encontraron resultados</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <table className="parents-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fbfe' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Padre/Apoderado</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contacto</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent) => (
                <tr key={parent.id} style={{ borderBottom: '1px solid #eef3fc', background: parent.is_active === false ? '#fafafa' : 'white' }}>
                  {/* Padre info */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: parent.is_active === false 
                          ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                          : 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {parent.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: parent.is_active === false ? '#9ca3af' : '#1e2f3e' }}>
                          {parent.name}
                          {parent.is_active === false && (
                            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>(Inactivo)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Contacto */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>{parent.email || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8aadc9', marginTop: 2 }}>{parent.phone || 'Sin teléfono'}</div>
                  </td>
                  
                  {/* Pedidos */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: '#e8f0fe',
                      color: '#1a73e8',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      <i className="fas fa-shopping-bag"></i>
                      {parent.order_count || 0}
                    </span>
                  </td>
                  
                  {/* Estado */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: parent.is_active === false ? '#fee2e2' : '#d4edda',
                      color: parent.is_active === false ? '#991b1b' : '#155724',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      <i className={parent.is_active === false ? 'fas fa-ban' : 'fas fa-check-circle'}></i>
                      {parent.is_active === false ? 'Inactivo' : 'Activo'}
                    </span>
                  </td>
                  
                  {/* Acciones */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {/* Editar */}
                      <button
                        onClick={() => openEditModal(parent)}
                        style={{
                          background: '#e8f0fe',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 30,
                          cursor: 'pointer',
                          color: '#1a73e8',
                          fontSize: '0.8rem',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#d2e3fc'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#e8f0fe'
                        }}
                      >
                        <i className="fas fa-pen"></i>
                        Editar
                      </button>
                      
                      {/* Activar/Desactivar */}
                      <button
                        onClick={() => handleToggleStatus(parent)}
                        style={{
                          background: parent.is_active === false ? '#d4edda' : '#fff3cd',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 30,
                          cursor: 'pointer',
                          color: parent.is_active === false ? '#155724' : '#856404',
                          fontSize: '0.8rem',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = 'brightness(0.95)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'brightness(1)'
                        }}
                      >
                        <i className={parent.is_active === false ? 'fas fa-play' : 'fas fa-pause'}></i>
                        {parent.is_active === false ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
