'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { getProfiles, toggleUserStatus } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'

export default function UsersPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [toggling, setToggling] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [isAdminRole, setIsAdminRole] = useState(false)
  const [isParentRole, setIsParentRole] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Estados para edición
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [editIsParent, setEditIsParent] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/login')
      return
    }
    loadData()
  }, [profile, router])

  const loadData = async () => {
    try {
      const data = await getProfiles()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = users.filter((user: any) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setToggling(userId)
    try {
      await toggleUserStatus(userId, !currentStatus)
      loadData()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Error al cambiar estado del usuario')
    } finally {
      setToggling(null)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      alert('Nombre y email son requeridos')
      return
    }

    if (!isAdminRole && !isParentRole) {
      alert('Debes seleccionar al menos un rol (Admin o Padre)')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          isAdmin: isAdminRole,
          isParent: isParentRole
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error al crear usuario')

      // Reset form
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setIsAdminRole(false)
      setIsParentRole(false)
      setShowAddForm(false)
      await loadData()

      const roles = []
      if (isAdminRole) roles.push('Admin')
      if (isParentRole) roles.push('Padre')
      alert(`Usuario creado exitosamente.\\n\\nEmail: ${newEmail}\\nRoles: ${roles.join(', ')}\\nContraseña temporal: temporal123`)
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert('Error al crear usuario: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Funciones para editar usuario
  const openEditModal = (user: any) => {
    setEditingUser(user)
    setEditName(user.name || '')
    setEditEmail(user.email || '')
    setEditPhone(user.phone || '')
    setEditIsAdmin(user.role === 'admin')
    setEditIsParent(user.is_parent)
    setShowEditForm(true)
  }

  const closeEditModal = () => {
    setShowEditForm(false)
    setEditingUser(null)
    setEditName('')
    setEditEmail('')
    setEditPhone('')
    setEditIsAdmin(false)
    setEditIsParent(false)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || !editEmail.trim()) {
      alert('Nombre y email son requeridos')
      return
    }

    if (!editIsAdmin && !editIsParent) {
      alert('El usuario debe tener al menos un rol')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          isAdmin: editIsAdmin,
          isParent: editIsParent,
          originalRoles: {
            isAdmin: editingUser.role === 'admin',
            isParent: editingUser.is_parent
          }
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error al actualizar usuario')

      closeEditModal()
      await loadData()

      const roles = []
      if (editIsAdmin) roles.push('Admin')
      if (editIsParent) roles.push('Padre')
      alert(`Usuario actualizado exitosamente.\\n\\nRoles: ${roles.join(', ')}`)
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert('Error al actualizar usuario: ' + error.message)
    } finally {
      setUpdating(false)
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
            <i className='fas fa-user-shield'></i>
            Gestión de Usuarios
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#5f7f9e', marginTop: 4, marginBottom: 0 }}>
            Administra todos los usuarios del sistema
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
            <i className='fas fa-search' style={{ color: '#8aadc9', fontSize: '0.9rem' }}></i>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Buscar por nombre o email...'
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
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: '#8aadc9',
                  padding: 0
                }}
              >
                <i className='fas fa-times'></i>
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
            <i className='fas fa-plus-circle'></i>
            {showAddForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      {/* Modal para crear usuario */}
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
            maxWidth: 500,
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
                <i className='fas fa-user-plus' style={{ marginRight: 10, color: '#1a73e8' }}></i>
                Crear Nuevo Usuario
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
                <i className='fas fa-times'></i>
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 20 }}>
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
                  type='text'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder='Ej: Juan Pérez'
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #e0edf9',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
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
                  type='email'
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder='ejemplo@email.com'
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #e0edf9',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
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
                  type='tel'
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder='+54 9 11 1234-5678'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #e0edf9',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#4a7c9c',
                  marginBottom: 12
                }}>
                  Roles *
                </label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: `2px solid ${isAdminRole ? '#1a73e8' : '#e0edf9'}`,
                    background: isAdminRole ? '#e8f0fe' : 'white',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type='checkbox'
                      checked={isAdminRole}
                      onChange={(e) => setIsAdminRole(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      color: isAdminRole ? '#1a73e8' : '#4a7c9c',
                      fontWeight: isAdminRole ? 600 : 500
                    }}>
                      <i className='fas fa-user-shield' style={{ marginRight: 6 }}></i>
                      Administrador
                    </span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: `2px solid ${isParentRole ? '#059669' : '#e0edf9'}`,
                    background: isParentRole ? '#d1fae5' : 'white',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type='checkbox'
                      checked={isParentRole}
                      onChange={(e) => setIsParentRole(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      color: isParentRole ? '#059669' : '#4a7c9c',
                      fontWeight: isParentRole ? 600 : 500
                    }}>
                      <i className='fas fa-user' style={{ marginRight: 6 }}></i>
                      Padre/Apoderado
                    </span>
                  </label>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid #eef3fc'
              }}>
                <button
                  type='button'
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #c2dcf5',
                    color: '#1a73e8',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type='submit'
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
                    gap: 8
                  }}
                >
                  <i className={submitting ? 'fas fa-spinner fa-pulse' : 'fas fa-save'}></i>
                  {submitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {showEditForm && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: 32,
            width: '90%',
            maxWidth: 480,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '1.5rem',
              color: '#1e2f3e',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <i className='fas fa-edit' style={{ color: '#1a73e8' }}></i>
              Editar Usuario
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: '#5f7f9e',
              marginBottom: 24
            }}>
              {editEmail}
            </p>

            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: 20 }}>
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
                  type='text'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder='Ej: Juan Pérez'
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #e0edf9',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
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
                  type='tel'
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder='+54 9 11 1234-5678'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #e0edf9',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#4a7c9c',
                  marginBottom: 12
                }}>
                  Roles *
                </label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: `2px solid ${editIsAdmin ? '#1a73e8' : '#e0edf9'}`,
                    background: editIsAdmin ? '#e8f0fe' : 'white',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type='checkbox'
                      checked={editIsAdmin}
                      onChange={(e) => setEditIsAdmin(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      color: editIsAdmin ? '#1a73e8' : '#4a7c9c',
                      fontWeight: editIsAdmin ? 600 : 500
                    }}>
                      <i className='fas fa-user-shield' style={{ marginRight: 6 }}></i>
                      Administrador
                    </span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: `2px solid ${editIsParent ? '#059669' : '#e0edf9'}`,
                    background: editIsParent ? '#d1fae5' : 'white',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type='checkbox'
                      checked={editIsParent}
                      onChange={(e) => setEditIsParent(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: '0.9rem',
                      color: editIsParent ? '#059669' : '#4a7c9c',
                      fontWeight: editIsParent ? 600 : 500
                    }}>
                      <i className='fas fa-user' style={{ marginRight: 6 }}></i>
                      Padre/Apoderado
                    </span>
                  </label>
                </div>
                {!editIsAdmin && !editIsParent && (
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    marginTop: 8,
                    marginBottom: 0
                  }}>
                    <i className='fas fa-exclamation-triangle' style={{ marginRight: 6 }}></i>
                    Debes seleccionar al menos un rol
                  </p>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end'
              }}>
                <button
                  type='button'
                  onClick={closeEditModal}
                  disabled={updating}
                  style={{
                    background: 'transparent',
                    border: '2px solid #e0edf9',
                    color: '#5f7f9e',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={updating || (!editIsAdmin && !editIsParent)}
                  style={{
                    background: updating ? '#5f7f9e' : '#1a73e8',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <i className={updating ? 'fas fa-spinner fa-pulse' : 'fas fa-save'}></i>
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla moderna de usuarios */}
      <div style={{
        background: 'white',
        borderRadius: 24,
        border: '1px solid #eef3fc',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {users.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#8aadc9'
          }}>
            <i className='fas fa-users' style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'block' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#5f7f9e' }}>No hay usuarios registrados</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Haz clic en "Nuevo Usuario" para agregar uno</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#8aadc9'
          }}>
            <i className='fas fa-search' style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'block' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#5f7f9e' }}>No se encontraron resultados</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -8px', padding: '0 8px' }}>
          <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ background: '#f8fbfe' }}>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#5f7f9e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Usuario</th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#5f7f9e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Email</th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#5f7f9e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Rol</th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#5f7f9e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Estado</th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#5f7f9e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Editar</th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#5f7f9e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Activo</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{
                  borderBottom: '1px solid #eef3fc',
                  background: user.is_active === false ? '#fafafa' : 'white'
                }}>
                  {/* Usuario info */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: user.role === 'admin'
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : (user.is_active === false
                            ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                            : 'linear-gradient(135deg, #1a73e8, #0d5bbf)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: user.is_active === false ? '#9ca3af' : '#1e2f3e'
                        }}>
                          {user.name || 'Sin nombre'}
                          {user.is_active === false && (
                            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>
                              (Inactivo)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>{user.email || '-'}</div>
                  </td>

                  {/* Rol */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {user.role === 'admin' && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 20,
                          background: '#d4edda',
                          color: '#155724',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          <i className='fas fa-user-shield'></i>
                          Admin
                        </span>
                      )}
                      {user.is_parent && (
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
                          <i className='fas fa-user'></i>
                          Padre
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 20,
                      background: user.is_active === false ? '#fee2e2' : '#d4edda',
                      color: user.is_active === false ? '#991b1b' : '#155724',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      <i className={user.is_active === false ? 'fas fa-ban' : 'fas fa-check-circle'}></i>
                      {user.is_active === false ? 'Inactivo' : 'Activo'}
                    </span>
                  </td>

                  {/* Editar */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => openEditModal(user)}
                      disabled={toggling === user.id}
                      style={{
                        background: '#e8f0fe',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 30,
                        cursor: 'pointer',
                        color: '#1a73e8',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s'
                      }}
                      title='Editar roles'
                    >
                      <i className='fas fa-edit'></i>
                      Editar
                    </button>
                  </td>

                  {/* Activar/Desactivar */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    {user.is_parent ? (
                      <button
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        disabled={toggling === user.id}
                        style={{
                          background: user.is_active === false ? '#d4edda' : '#fee2e2',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 30,
                          cursor: toggling === user.id ? 'not-allowed' : 'pointer',
                          color: user.is_active === false ? '#155724' : '#991b1b',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s'
                        }}
                        title={user.is_active === false ? 'Activar usuario' : 'Desactivar usuario'}
                      >
                        <i className={toggling === user.id ? 'fas fa-spinner fa-pulse' : (user.is_active === false ? 'fas fa-check' : 'fas fa-ban')}></i>
                        {toggling === user.id ? '...' : (user.is_active === false ? 'Activar' : 'Desactivar')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#8aadc9' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 640px) {
          .users-table th,
          .users-table td {
            padding: 10px 8px !important;
            font-size: 0.8rem !important;
          }
          .users-table th:nth-child(2),
          .users-table td:nth-child(2) {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  )
}