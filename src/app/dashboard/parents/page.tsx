'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getParents, createParent, deleteParent } from '@/lib/supabase/services'
import { Parent } from '@/types'

export default function ParentsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadParents()
  }, [profile, router])

  const loadParents = async () => {
    try {
      const data = await getParents()
      setParents(data)
    } catch (error) {
      console.error('Error loading parents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createParent(newName, newEmail || undefined)
      setNewName('')
      setNewEmail('')
      setShowAddForm(false)
      loadParents()
    } catch (error) {
      console.error('Error creating parent:', error)
      alert('Error al crear padre')
    }
  }

  const handleDeleteParent = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}? Se eliminarán todos sus pedidos.`)) {
      return
    }
    try {
      await deleteParent(id)
      loadParents()
    } catch (error) {
      console.error('Error deleting parent:', error)
      alert('Error al eliminar padre')
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Padres/Apoderados</h1>
          <p className="text-gray-600">Gestión de padres y apoderados</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancelar' : 'Agregar Padre'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Padre/Apoderado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddParent} className="space-y-4">
              <Input
                label="Nombre completo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                label="Email (opcional)"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit">Guardar</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {parents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay padres registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent) => (
                    <tr key={parent.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{parent.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{parent.email || '-'}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteParent(parent.id, parent.name)}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
