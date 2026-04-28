'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProject, createProduct, deleteProduct } from '@/lib/supabase/services'

export default function CampaignDetailPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadProject()
  }, [profile, router, projectId])

  const loadProject = async () => {
    try {
      const data = await getProject(projectId)
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProduct(projectId, newProductName, parseFloat(newProductPrice))
      setNewProductName('')
      setNewProductPrice('')
      setShowAddProduct(false)
      loadProject()
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Error al crear producto')
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${productName}"?`)) {
      return
    }
    try {
      await deleteProduct(productId)
      loadProject()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar producto')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Campaña no encontrada</p>
        <Button onClick={() => router.push('/dashboard/campaigns')} className="mt-4">
          Volver a Campañas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => router.push('/dashboard/campaigns')} className="mb-2">
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-600">{project.description}</p>}
        </div>
        <Button onClick={() => setShowAddProduct(!showAddProduct)}>
          {showAddProduct ? 'Cancelar' : 'Agregar Producto'}
        </Button>
      </div>

      {showAddProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <Input
                label="Nombre del producto"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
              <Input
                label="Precio"
                type="number"
                step="0.01"
                min="0"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit">Agregar</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {project.products?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay productos en esta campaña</p>
          ) : (
            <div className="space-y-2">
              {project.products.map((product: any) => (
                <div key={product.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
