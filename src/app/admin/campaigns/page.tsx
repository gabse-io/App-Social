'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProjects, createProject, deleteProject, getParents, addParentToProject, removeParentFromProject, createProduct, deleteProduct } from '@/lib/supabase/services'

export default function CampaignsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [showProductsForm, setShowProductsForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/login')
      return
    }
    loadData()
  }, [profile, router])

  const loadData = async () => {
    try {
      const [projectsData, parentsData] = await Promise.all([
        getProjects(),
        getParents(),
      ])
      setProjects(projectsData)
      setFilteredProjects(projectsData)
      setParents(parentsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProjects(projects)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = projects.filter((project: any) =>
        project.name?.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term)
      )
      setFilteredProjects(filtered)
    }
  }, [searchTerm, projects])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProject(newName, newDescription || undefined)
      setNewName('')
      setNewDescription('')
      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error al crear campaña')
    }
  }

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la campaña "${name}"? Se eliminarán todos sus productos y pedidos.`)) {
      return
    }
    try {
      await deleteProject(id)
      loadData()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error al eliminar campaña')
    }
  }

  const handleEditProject = (project: any) => {
    setSelectedProject(project)
    setSelectedParents(project.project_parents?.map((pp: any) => pp.parent_id) || [])
    setShowEditForm(true)
  }

  const handleSaveParents = async () => {
    if (!selectedProject) return

    try {
      const currentParentIds = selectedProject.project_parents?.map((pp: any) => pp.parent_id) || []
      const toAdd = selectedParents.filter(id => !currentParentIds.includes(id))
      const toRemove = currentParentIds.filter((id: string) => !selectedParents.includes(id))

      for (const parentId of toAdd) {
        await addParentToProject(selectedProject.id, parentId)
      }
      for (const parentId of toRemove) {
        await removeParentFromProject(selectedProject.id, parentId)
      }

      setShowEditForm(false)
      setSelectedProject(null)
      setSelectedParents([])
      loadData()
    } catch (error) {
      console.error('Error saving parents:', error)
      alert('Error al guardar padres')
    }
  }

  const toggleParent = (parentId: string) => {
    setSelectedParents(prev =>
      prev.includes(parentId)
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    )
  }

  const handleEditProducts = (project: any) => {
    setSelectedProject(project)
    setShowProductsForm(true)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      await createProduct(selectedProject.id, newProductName, parseFloat(newProductPrice))
      setNewProductName('')
      setNewProductPrice('')
      loadData()
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Error al crear producto')
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${productName}"?`)) {
      return
    }
    try {
      await deleteProduct(productId)
      loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar producto')
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
            <i className="fas fa-bullhorn"></i>
            Campañas de Recaudación
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#5f7f9e', marginTop: 4, marginBottom: 0 }}>
            Gestiona campañas, productos y asigna padres participantes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Buscador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            borderRadius: 40,
            padding: '8px 16px',
            border: '1.5px solid #e0edf9',
            gap: 8,
            minWidth: 200,
          maxWidth: '100%'
          }}>
            <i className="fas fa-search" style={{ color: '#8aadc9', fontSize: '0.9rem' }}></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar campaña por nombre..."
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
            {showAddForm ? 'Cancelar' : 'Nueva campaña'}
          </button>
        </div>
      </div>

      {/* Modal para crear campaña */}
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
                <i className="fas fa-flag-checkered" style={{ marginRight: 10, color: '#1a73e8' }}></i>
                Nueva campaña
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
            <form onSubmit={handleAddProject}>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#4a7c9c',
                  marginBottom: 6
                }}>
                  Nombre de la campaña
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Ej: Venta de empanadas solidarias"
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
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#4a7c9c',
                  marginBottom: 6
                }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Motivo, fechas, puntos de entrega..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #e0edf9',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
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
                  style={{
                    background: '#1a73e8',
                    border: 'none',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
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
                  <i className="fas fa-save"></i>
                  Guardar campaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar padres */}
      {showEditForm && selectedProject && (
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
          setSelectedProject(null)
          setSelectedParents([])
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
                <i className="fas fa-users" style={{ marginRight: 10, color: '#1a73e8' }}></i>
                Editar Padres - {selectedProject.name}
              </h2>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setSelectedProject(null)
                  setSelectedParents([])
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

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              background: '#fafdff',
              borderRadius: 24,
              padding: 16,
              maxHeight: 300,
              overflowY: 'auto',
              marginBottom: 20
            }}>
              {parents.map((parent) => (
                <label key={parent.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: selectedParents.includes(parent.id) ? '#e8f0fe' : 'white',
                  padding: '8px 12px',
                  borderRadius: 20,
                  border: selectedParents.includes(parent.id) ? '1.5px solid #1a73e8' : '1.5px solid #e0edf9',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedParents.includes(parent.id)}
                    onChange={() => toggleParent(parent.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span><i className="fas fa-user" style={{ marginRight: 6, color: '#1a73e8' }}></i>{parent.name}</span>
                  {parent.email && <span style={{ fontSize: '0.75rem', color: '#8aadc9' }}>({parent.email})</span>}
                </label>
              ))}
            </div>
            <small style={{ color: '#8aadc9', display: 'block', marginBottom: 20 }}>
              <i className="fas fa-info-circle" style={{ marginRight: 6 }}></i>
              Solo estos padres podrán ver y tomar pedidos de esta campaña
            </small>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 28,
              paddingTop: 16,
              borderTop: '1px solid #eef3fc'
            }}>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setSelectedProject(null)
                  setSelectedParents([])
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
                onClick={handleSaveParents}
                style={{
                  background: '#1a73e8',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: 40,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
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
                <i className="fas fa-save"></i>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar productos */}
      {showProductsForm && selectedProject && (
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
          setShowProductsForm(false)
          setSelectedProject(null)
          setNewProductName('')
          setNewProductPrice('')
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
                <i className="fas fa-box" style={{ marginRight: 10, color: '#1a73e8' }}></i>
                Gestión de Productos - {selectedProject.name}
              </h2>
              <button
                onClick={() => {
                  setShowProductsForm(false)
                  setSelectedProject(null)
                  setNewProductName('')
                  setNewProductPrice('')
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

            <form onSubmit={handleAddProduct} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 16,
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 2 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#4a7c9c',
                    marginBottom: 6
                  }}>
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                    placeholder="Ej: Camiseta Hindú"
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
                <div style={{ width: 140 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#4a7c9c',
                    marginBottom: 6
                  }}>
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    required
                    placeholder="$0.00"
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
                <button
                  type="submit"
                  style={{
                    background: '#1a73e8',
                    border: 'none',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(26,115,232,0.2)',
                    marginBottom: 0
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
                  <i className="fas fa-plus"></i>
                  Agregar
                </button>
              </div>
            </form>

            {selectedProject.products && selectedProject.products.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {selectedProject.products.map((product: any) => (
                  <div key={product.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: '#fafdff',
                    borderRadius: 16,
                    marginBottom: 10,
                    border: '1px solid #eef3fc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #1a73e8, #0d5bbf)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1rem'
                      }}>
                        <i className="fas fa-tag"></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e2f3e', fontSize: '0.95rem' }}>{product.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#1a73e8', fontWeight: 600 }}>${product.price.toFixed(2)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      style={{
                        background: '#ffe8e6',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: 40,
                        cursor: 'pointer',
                        color: '#d46b5e',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffd5d0'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffe8e6'
                      }}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#8aadc9',
                background: '#fafdff',
                borderRadius: 24
              }}>
                <i className="fas fa-box-open" style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}></i>
                <p>No hay productos en esta campaña</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid de tarjetas de campaña */}
      <div className="campaigns-grid">
        {projects.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#8aadc9',
            background: 'white',
            borderRadius: 48
          }}>
            <i className="fas fa-folder-open" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'block' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#5f7f9e' }}>No hay campañas activas</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Haz clic en "Nueva campaña" para comenzar a recaudar fondos</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#8aadc9'
          }}>
            <i className="fas fa-search" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'block' }}></i>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#5f7f9e' }}>No se encontraron resultados</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} style={{
              background: 'white',
              borderRadius: 32,
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.25s ease',
              border: '1px solid #eef3fc'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 20px 30px -12px rgba(0, 0, 0, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Header de la tarjeta */}
              <div style={{
                background: 'linear-gradient(135deg, #1a73e8, #0e5fc9)',
                padding: '20px 24px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{project.name}</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleEditProducts(project)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 30,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: '0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.35)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <i className="fas fa-box"></i> Productos
                  </button>
                  <button
                    onClick={() => handleEditProject(project)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 30,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: '0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.35)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <i className="fas fa-users"></i> Padres
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 30,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: '0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.35)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Body de la tarjeta */}
              <div style={{ padding: '20px 24px' }}>
                {/* Descripción */}
                <div style={{ color: '#4a6f8f', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.4 }}>
                  <i className="fas fa-align-left" style={{ marginRight: 6, color: '#7d9bc0' }}></i>
                  {project.description || 'Sin descripción'}
                </div>

                {/* Productos */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: '#7d9bc0',
                    letterSpacing: '0.5px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <i className="fas fa-tags"></i> Productos ({project.products?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {project.products && project.products.length > 0 ? (
                      project.products.map((product: any) => (
                        <span key={product.id} style={{
                          background: '#f0f7fe',
                          borderRadius: 40,
                          padding: '6px 14px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#1c5d8c',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <i className="fas fa-tag" style={{ fontSize: '0.7rem' }}></i>
                          {product.name} - ${product.price.toFixed(2)}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#8aadc9', fontSize: '0.8rem' }}>Sin productos</span>
                    )}
                  </div>
                </div>

                {/* Padres asignados */}
                <div style={{
                  background: '#fafdff',
                  borderRadius: 24,
                  padding: '14px 18px',
                  fontSize: '0.8rem',
                  color: '#4a6f8f',
                  border: '1px solid #eef3fc',
                  lineHeight: 1.5
                }}>
                  <i className="fas fa-user-check" style={{ marginRight: 8, color: '#1a73e8' }}></i>
                  <strong>Padres habilitados:</strong><br />
                  {project.project_parents && project.project_parents.length > 0
                    ? project.project_parents.map((pp: any) => {
                        const parent = parents.find((p) => p.id === pp.parent_id)
                        return parent?.name
                      }).filter(Boolean).join(', ')
                    : 'Ningún padre asignado'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .campaigns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        @media (max-width: 640px) {
          .campaigns-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  )
}
