'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { getOrders, updateOrderDeliveryStatus } from '@/lib/supabase/services'

export default function DeliveriesPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      // Solo mostrar pedidos pendientes de entrega
      const pendingOrders = data.filter((o: any) => o.delivery_status === 'pending')
      setOrders(pendingOrders)
      setFilteredOrders(pendingOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar pedidos cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = orders.filter((order: any) =>
        order.customer_name?.toLowerCase().includes(term) ||
        order.id?.toLowerCase().includes(term) ||
        order.order_number?.toLowerCase().includes(term)
      )
      setFilteredOrders(filtered)
    }
  }, [searchTerm, orders])

  const markAsDelivered = async (orderId: string) => {
    try {
      await updateOrderDeliveryStatus(orderId, 'delivered')
      loadOrders()
    } catch (error) {
      console.error('Error updating delivery status:', error)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1e2f3e' }}>
          <i className="fas fa-truck" style={{ marginRight: 10, color: '#1a73e8' }}></i>
          Entregas Pendientes
        </h3>

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
            placeholder="Buscar por nombre o ID..."
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
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2edfc', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', margin: '0 -8px', padding: '0 8px' }}>
          <table className="deliveries-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fbfe' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Padre</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Producto</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Cant</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Total</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Pago</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#5f7f9e' }}>
                    <i className={searchTerm ? "fas fa-search" : "fas fa-check-circle"} style={{ fontSize: 48, marginBottom: 16, color: searchTerm ? '#8aadc9' : '#10B981', display: 'block' }}></i>
                    {searchTerm ? 'No se encontraron resultados. Intenta con otros términos.' : 'No hay entregas pendientes. ¡Todo está al día!'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eef3fc' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#1e2f3e', fontWeight: 600 }}>
                      <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#5f7f9e' }}>{order.order_number || 'Sin número'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#5f7f9e' }}>{order.parent_name || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#5f7f9e' }}>
                      {order.order_items && order.order_items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {order.order_items.map((item: any) => (
                            <div key={item.id} style={{ fontSize: '0.8rem' }}>
                              {item.product_name} x{item.quantity}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', textAlign: 'center' }}>
                      {order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right' }}>
                      ${order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: order.payment_status === 'paid' ? '#d4edda' : '#fff3cd',
                        color: order.payment_status === 'paid' ? '#155724' : '#856404',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => markAsDelivered(order.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#1a73e8',
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-check" style={{ marginRight: 6 }}></i>
                        Entregar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .deliveries-table th,
          .deliveries-table td {
            padding: 10px 8px !important;
            font-size: 0.8rem !important;
          }
          .deliveries-table th:nth-child(4),
          .deliveries-table td:nth-child(4),
          .deliveries-table th:nth-child(5),
          .deliveries-table td:nth-child(5) {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
