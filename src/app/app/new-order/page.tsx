'use client'

export const dynamic = 'force-dynamic'

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
    loadProjects()
  }, [profile, router])

  const loadProjects = async () => {
    try {
      if (!profile?.email) return

      console.log('Cargando proyectos para padre:', profile.email)

      const [projectsData, parentsData] = await Promise.all([
        getProjectsForParent(profile.email),
        getParents(),
      ])

      console.log('Proyectos cargados:', projectsData)
      console.log('Padres cargados:', parentsData)

      setProjects(projectsData)

      // Find parent by email
      const parent = parentsData.find(p => p.email === profile.email)
      if (parent) {
        setParentId(parent.id)
        console.log('Padre encontrado:', parent.id)
      } else {
        console.log('Padre no encontrado con email:', profile.email)
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

      await createOrder(
        selectedProject.id,
        parentId,
        itemsWithQuantity.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        customerName,
        generatePaymentLink
      )

      router.push('/app/my-orders')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e2edfc', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e2f3e', margin: '0 0 8px 0' }}>Nuevo Pedido</h1>
        <p style={{ color: '#5f7f9e', margin: 0 }}>Crea un nuevo pedido en 3 pasos</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: step >= s ? '#1a73e8' : '#e2edfc',
              color: step >= s ? 'white' : '#5f7f9e'
            }}>
              {s}
            </div>
            {s < 3 && (
              <div style={{
                flex: 1,
                height: 3,
                margin: '0 8px',
                background: step > s ? '#1a73e8' : '#e2edfc',
                borderRadius: 2
              }}></div>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Campaign */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e2f3e', marginBottom: 16 }}>Paso 1: Selecciona una campaña</h2>
          {projects.length === 0 ? (
            <Card>
              <CardContent>
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ color: '#5f7f9e' }}>No tienes campañas habilitadas. Contacta al administrador.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((project) => (
                <Card key={project.id} className="project-card">
                  <CardContent>
                    <button
                      onClick={() => handleSelectProject(project)}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e2f3e', margin: '0 0 4px 0' }}>{project.name}</h3>
                        {project.description && (
                          <p style={{ fontSize: '0.9rem', color: '#5f7f9e', margin: '0 0 8px 0' }}>{project.description}</p>
                        )}
                        <p style={{ fontSize: '0.85rem', color: '#8aadc9', margin: 0 }}>
                          {project.products?.length || 0} productos disponibles
                        </p>
                      </div>
                      <Badge>Seleccionar</Badge>
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
        <div>
          <div className="order-step-header">
            <h2 className="order-step-title">Paso 2: Selecciona productos</h2>
            <button
              onClick={() => setStep(1)}
              className="order-step-back-btn"
            >
              <i className='fas fa-arrow-left'></i>
              Volver
            </button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{selectedProject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cart.map((item) => (
                  <div key={item.productId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    border: '1px solid #e2edfc',
                    borderRadius: 12
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#1e2f3e', margin: '0 0 4px 0' }}>{item.productName}</p>
                      <p style={{ fontSize: '0.9rem', color: '#5f7f9e', margin: 0 }}>${item.price.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <button
                        onClick={() => handleQuantityChange(item.productId, -1)}
                        disabled={item.quantity === 0}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          border: '2px solid #e0edf9',
                          background: 'white',
                          color: item.quantity === 0 ? '#9ca3af' : '#1a73e8',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          cursor: item.quantity === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1e2f3e' }}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, 1)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          border: '2px solid #e0edf9',
                          background: 'white',
                          color: '#1a73e8',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {getTotalItems() > 0 && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2edfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Total:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a73e8' }}>${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <button
            onClick={handleContinueToStep3}
            disabled={getTotalItems() === 0}
            style={{
              width: '100%',
              marginTop: 16,
              background: getTotalItems() === 0 ? '#5f7f9e' : '#1a73e8',
              border: 'none',
              color: 'white',
              padding: '14px 24px',
              borderRadius: 40,
              fontWeight: 600,
              fontSize: '1rem',
              cursor: getTotalItems() === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <i className='fas fa-arrow-right'></i>
            Continuar
          </button>
        </div>
      )}

      {/* Step 3: Review and Confirm */}
      {step === 3 && (
        <div>
          <div className="order-step-header">
            <h2 className="order-step-title">Paso 3: Confirma tu pedido</h2>
            <button
              onClick={() => setStep(2)}
              className="order-step-back-btn"
            >
              <i className='fas fa-arrow-left'></i>
              Volver
            </button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#5f7f9e', margin: '0 0 4px 0' }}>Campaña</p>
                  <p style={{ fontWeight: 600, color: '#1e2f3e', margin: 0 }}>{selectedProject?.name}</p>
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
                    Nombre del cliente *
                  </label>
                  <input
                    type='text'
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder='Nombre de quien recibe el pedido'
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

                {/* MercadoPago link - oculto temporalmente
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="paymentLink"
                    checked={generatePaymentLink}
                    onChange={(e) => setGeneratePaymentLink(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="paymentLink" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                    Generar link de pago MercadoPago
                  </label>
                </div>
                */}

                <div style={{ borderTop: '1px solid #e2edfc', paddingTop: 16 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 8px 0' }}>Productos:</p>
                  {cart.filter(item => item.quantity > 0).map((item) => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                      <span>{item.productName} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2edfc' }}>
                    <span>Total</span>
                    <span style={{ color: '#1a73e8' }}>${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <button
            onClick={handleSubmitOrder}
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 16,
              background: submitting ? '#5f7f9e' : '#1a73e8',
              border: 'none',
              color: 'white',
              padding: '14px 24px',
              borderRadius: 40,
              fontWeight: 600,
              fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <i className={submitting ? 'fas fa-spinner fa-pulse' : 'fas fa-check'}></i>
            {submitting ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .project-card {
          cursor: pointer;
          transition: all 0.2s;
        }
        .project-card > div {
          padding: 20px;
        }
        .order-step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .order-step-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e2f3e;
          margin: 0;
        }
        .order-step-back-btn {
          background: transparent;
          border: 2px solid #e0edf9;
          color: #5f7f9e;
          padding: 10px 20px;
          border-radius: 40px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 480px) {
          .order-step-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .order-step-back-btn {
            padding: 8px 16px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}
