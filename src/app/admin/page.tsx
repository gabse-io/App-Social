'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { getOrderStats, getOrders } from '@/lib/supabase/services'

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/login')
      return
    }
    loadData()
  }, [profile, router])

  const loadData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getOrderStats(),
        getOrders(),
      ])
      setStats(statsData)
      setRecentOrders(ordersData.slice(0, 10))
    } catch (error) {
      console.error('Error loading dashboard:', error)
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
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e2f3e' }}>
        <i className="fas fa-chart-line" style={{ marginRight: 10, color: '#1a73e8' }}></i>
        Dashboard
      </h3>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard 
          icon="fa-shopping-cart" 
          label="Total Pedidos" 
          value={stats?.totalOrders || 0} 
          color="#1a73e8"
        />
        <StatCard 
          icon="fa-boxes" 
          label="Productos Vendidos" 
          value={stats?.totalProducts || 0} 
          color="#06B6D4"
        />
        <StatCard 
          icon="fa-dollar-sign" 
          label="Recaudado" 
          value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`} 
          color="#10B981"
        />
        <StatCard 
          icon="fa-truck" 
          label="Entregas Pendientes" 
          value={stats?.pendingDeliveries || 0} 
          color="#F97316"
        />
      </div>

      {/* Recent Orders */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2edfc', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2edfc' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e2f3e' }}>
            <i className="fas fa-clipboard-list" style={{ marginRight: 10, color: '#1a73e8' }}></i>
            Pedidos Recientes
          </h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fbfe' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cliente</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Producto</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cantidad</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pago</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#5f7f9e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#5f7f9e' }}>
                    <i className="fas fa-inbox" style={{ fontSize: 48, marginBottom: 16, color: '#c2dcf5', display: 'block' }}></i>
                    No hay pedidos registrados
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eef3fc' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#1e2f3e' }}>
                      <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#5f7f9e' }}>{order.order_number || 'Sin número'}</div>
                    </td>
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
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#1e2f3e', textAlign: 'center' }}>
                      {order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#1e2f3e', fontWeight: 600, textAlign: 'right' }}>
                      ${order.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Badge variant={order.payment_status}>
                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Badge variant={order.delivery_status}>
                        {order.delivery_status === 'delivered' ? 'Entregado' : 'Pendiente'}
                      </Badge>
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
      `}</style>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: string | number, color: string }) {
  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 16, 
      padding: 24, 
      border: '1px solid #e2edfc',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: color + '15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <i className={`fas ${icon}`} style={{ color, fontSize: 24 }}></i>
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e2f3e', marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: '0.85rem', color: '#5f7f9e' }}>{label}</div>
      </div>
    </div>
  )
}

function Badge({ children, variant }: { children: React.ReactNode, variant: string }) {
  const colors: Record<string, { bg: string, color: string }> = {
    paid: { bg: '#d4edda', color: '#155724' },
    unpaid: { bg: '#fff3cd', color: '#856404' },
    delivered: { bg: '#cce5ff', color: '#004085' },
    pending: { bg: '#f8d7da', color: '#721c24' },
  }
  const { bg, color } = colors[variant] || colors.pending

  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: 20,
      background: bg,
      color: color,
      fontSize: '0.75rem',
      fontWeight: 600
    }}>
      {children}
    </span>
  )
}
