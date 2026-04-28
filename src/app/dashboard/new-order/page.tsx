'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getProjectsForParent, getParents, createOrder } from '@/lib/supabase/services'

interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

export default function NewOrderPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [generatePaymentLink, setGeneratePaymentLink] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      router.push('/dashboard')
      return
    }
    loadProjects()
  }, [profile, router])

  const loadProjects = async () => {
    try {
      if (!profile?.email) return
      
      const [projectsData, parentsData] = await Promise.all([
        getProjectsForParent(profile.email),
        getParents(),
      ])
      
      setProjects(projectsData)
      
      // Find parent by email
      const parent = parentsData.find(p => p.email === profile.email)
      if (parent) {
        setParentId(parent.id)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (project: any) => {
    setSelectedProject(project)
    setCart(project.products?.map((p: any) => ({
      productId: p.id,
      productName: p.name,
      price: p.price,
      quantity: 0,
    })) || [])
    setStep(2)
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  const handleContinueToStep3 = () => {
    const hasItems = cart.some(item => item.quantity > 0)
    if (!hasItems) {
      alert('Por favor selecciona al menos un producto')
      return
    }
    setStep(3)
  }

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente')
      return
    }

    if (!parentId || !selectedProject) {
      alert('Error: No se pudo identificar el padre o la campaña')
      return
    }

    setSubmitting(true)

    try {
      const itemsWithQuantity = cart.filter(item => item.quantity > 0)
      
      for (const item of itemsWithQuantity) {
        await createOrder(
          selectedProject.id,
          parentId,
          item.productId,
          item.productName,
          item.price,
          item.quantity,
          customerName,
          generatePaymentLink
        )
      }

      router.push('/dashboard/my-orders')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error al crear el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Pedido</h1>
        <p className="text-gray-600">Crea un nuevo pedido en 3 pasos</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-[#1a73e8] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-[#1a73e8]' : 'bg-gray-200'}`}></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Select Campaign */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Paso 1: Selecciona una campaña</h2>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No tienes campañas habilitadas. Contacta al administrador.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <button
                      onClick={() => handleSelectProject(project)}
                      className="w-full text-left flex justify-between items-start"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {project.products?.length || 0} productos disponibles
                        </p>
                      </div>
                      <Badge variant="default">Seleccionar</Badge>
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Products */}
      {step === 2 && selectedProject && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Paso 2: Selecciona productos</h2>
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Volver
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{selectedProject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleQuantityChange(item.productId, -1)}
                        disabled={item.quantity === 0}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleQuantityChange(item.productId, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {getTotalItems() > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-[#1a73e8]">${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleContinueToStep3} className="w-full" disabled={getTotalItems() === 0}>
            Continuar
          </Button>
        </div>
      )}

      {/* Step 3: Review and Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Paso 3: Confirma tu pedido</h2>
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Campaña</p>
                  <p className="font-medium">{selectedProject?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del cliente *
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre de quien recibe el pedido"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="paymentLink"
                    checked={generatePaymentLink}
                    onChange={(e) => setGeneratePaymentLink(e.target.checked)}
                    className="w-4 h-4 text-[#1a73e8] rounded focus:ring-[#1a73e8]"
                  />
                  <label htmlFor="paymentLink" className="text-sm">
                    Generar link de pago MercadoPago
                  </label>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium mb-2">Productos:</p>
                  {cart.filter(item => item.quantity > 0).map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm py-1">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-[#1a73e8]">${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmitOrder}
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Procesando...' : 'Confirmar Pedido'}
          </Button>
        </div>
      )}
    </div>
  )
}
