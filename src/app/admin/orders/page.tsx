'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { getOrders, updateOrderPaymentStatus, updateOrderDeliveryStatus } from '@/lib/supabase/services'

export default function OrdersPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending_payment' | 'pending_delivery'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/login')
      return
    }
    loadOrders()
  }, [profile, router])

  const loadOrders = async () => {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusChange = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    try {
      await updateOrderPaymentStatus(orderId, newStatus)
      loadOrders()
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  const handleDeliveryStatusChange = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'delivered' ? 'pending' : 'delivered'
    try {
      await updateOrderDeliveryStatus(orderId, newStatus)
      loadOrders()
    } catch (error) {
      console.error('Error updating delivery status:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending_payment' && order.payment_status !== 'unpaid') return false
    if (filter === 'pending_delivery' && order.delivery_status !== 'pending') return false
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchesName = order.customer_name?.toLowerCase().includes(term)
      const matchesId = order.id?.toLowerCase().includes(term)
      const matchesOrderNumber = order.order_number?.toLowerCase().includes(term)
      if (!matchesName && !matchesId && !matchesOrderNumber) return false
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e2edfc', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1e2f3e' }}>
          <i className="fas fa-shopping-cart" style={{ marginRight: 10, color: '#1a73e8' }}></i>
          Gestión de Pedidos
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', width: '100%', maxWidth: 600 }}>
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
              placeholder="Buscar por nombre o ID..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                color: '#1e2f3e',
                width: '100%',
                minWidth: 160
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

          <div className="orders-filters">
            {(['all', 'pending_payment', 'pending_delivery'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`orders-filter-btn ${filter === f ? 'active' : ''}`}
              >
                {f === 'all' ? 'Todos' : f === 'pending_payment' ? 'Pago Pendiente' : 'Entrega Pendiente'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: 16, border: '1px solid #e2edfc' }}>
            <i className="fas fa-inbox" style={{ fontSize: 48, marginBottom: 16, color: '#c2dcf5', display: 'block' }}></i>
            No hay pedidos {filter !== 'all' || searchTerm ? 'con ese filtro' : ''}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2edfc', padding: 20 }}>
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
                  <button
                    onClick={() => handlePaymentStatusChange(order.id, order.payment_status)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: 'none',
                      background: order.payment_status === 'paid' ? '#10B981' : '#FEF3C7',
                      color: order.payment_status === 'paid' ? 'white' : '#92400E',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {order.payment_status === 'paid' ? 'Pago: Pagado' : 'Pago: Pendiente'}
                  </button>
                  <button
                    onClick={() => handleDeliveryStatusChange(order.id, order.delivery_status)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: 'none',
                      background: order.delivery_status === 'delivered' ? '#10B981' : '#FEF3C7',
                      color: order.delivery_status === 'delivered' ? 'white' : '#92400E',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {order.delivery_status === 'delivered' ? 'Entrega: Entregado' : 'Entrega: Pendiente'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#5f7f9e', textTransform: 'uppercase', fontWeight: 600 }}>Cliente</div>
                  <div style={{ fontSize: '0.9rem', color: '#1e2f3e', fontWeight: 600 }}>{order.customer_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#5f7f9e', textTransform: 'uppercase', fontWeight: 600 }}>Padre</div>
                  <div style={{ fontSize: '0.9rem', color: '#5f7f9e' }}>{order.parent_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#5f7f9e', textTransform: 'uppercase', fontWeight: 600 }}>Campaña</div>
                  <div style={{ fontSize: '0.9rem', color: '#5f7f9e' }}>{order.project_name || 'N/A'}</div>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #eef3fc' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a73e8' }}>
                  Total: ${order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}
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
        .orders-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .orders-filter-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: none;
          background: #e2edfc;
          color: #5f7f9e;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .orders-filter-btn.active {
          background: #1a73e8;
          color: white;
        }
        @media (max-width: 480px) {
          .orders-filter-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
