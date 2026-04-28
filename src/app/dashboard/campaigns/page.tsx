'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getProjects, createProject, deleteProject, getParents, addParentToProject, removeParentFromProject } from '@/lib/supabase/services'
import { Project, Parent } from '@/types'

export default function CampaignsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedParents, setSelectedParents] = useState<string[]>([])

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
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
      setParents(parentsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const project = await createProject(newName, newDescription || undefined)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
          <p className="text-gray-600">Gestión de campañas de recaudación</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancelar' : 'Nueva Campaña'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Campaña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProject} className="space-y-4">
              <Input
                label="Nombre de la campaña"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                label="Descripción (opcional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit">Crear</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showEditForm && selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Padres - {selectedProject.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {parents.map((parent) => (
                  <label key={parent.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedParents.includes(parent.id)}
                      onChange={() => toggleParent(parent.id)}
                      className="w-4 h-4 text-[#1a73e8] rounded focus:ring-[#1a73e8]"
                    />
                    <span className="text-sm">{parent.name}</span>
                    {parent.email && <span className="text-xs text-gray-500">({parent.email})</span>}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveParents}>Guardar</Button>
                <Button variant="secondary" onClick={() => {
                  setShowEditForm(false)
                  setSelectedProject(null)
                  setSelectedParents([])
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <p className="text-center text-gray-500 py-8 col-span-full">No hay campañas registradas</p>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Productos: {project.products?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Padres habilitados: {project.project_parents?.length || 0}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEditProject(project)}>
                      Editar Padres
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteProject(project.id, project.name)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
