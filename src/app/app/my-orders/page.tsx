'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getOrders, getParents } from '@/lib/supabase/services'

export default function MyOrdersPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [profile, router])

  const loadOrders = async () => {
    try {
      if (!profile?.email) return
      
      const [parentsData] = await Promise.all([
        getParents(),
      ])
      
      const parent = parentsData.find(p => p.email === profile.email)
      if (!parent) {
        setLoading(false)
        return
      }

      const ordersData = await getOrders(parent.id)
      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
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
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e2f3e', margin: '0 0 8px 0' }}>Mis Pedidos</h1>
        <p style={{ color: '#5f7f9e', margin: 0 }}>Historial de tus pedidos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#5f7f9e', marginBottom: 16 }}>No tienes pedidos registrados.</p>
              <button
                onClick={() => router.push('/app/new-order')}
                style={{
                  padding: '12px 24px',
                  borderRadius: 10,
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Crear tu primer pedido
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((order) => (
                <div key={order.id} style={{ border: '1px solid #e2edfc', borderRadius: 12, padding: 20, background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #eef3fc' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e2f3e' }}>
                        {order.order_number || 'Sin número'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#5f7f9e', marginTop: 4 }}>
                        {new Date(order.created_at).toLocaleDateString('es-AR', { dateStyle: 'medium' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Badge variant={order.payment_status === 'paid' ? 'paid' : 'unpaid'}>
                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                      <Badge variant={order.delivery_status === 'delivered' ? 'delivered' : 'pending'}>
                        {order.delivery_status === 'delivered' ? 'Entregado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.85rem', color: '#5f7f9e', marginBottom: 8 }}>Productos:</div>
                    {order.order_items && order.order_items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {order.order_items.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fbfe', borderRadius: 8 }}>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e2f3e', fontSize: '0.9rem' }}>{item.product_name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#5f7f9e' }}>x{item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 700, color: '#1a73e8', fontSize: '0.95rem' }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>Sin productos</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #eef3fc' }}>
                    <div style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>
                      Cliente: <span style={{ fontWeight: 600, color: '#1e2f3e' }}>{order.customer_name}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a73e8' }}>
                      Total: ${order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
